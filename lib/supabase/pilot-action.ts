"use server";

import { z } from "zod";
import type { FinanceState } from "@/lib/types";
import { mutationSchema } from "./mutation-schema";
import { createSupabaseServerClient, isDemoMode } from "./server";
import { loadFinanceState } from "./data-access";

const id = z.uuid();

export type PersistentMutationResult =
  | { ok: true; state: FinanceState }
  | { ok: false; message: string };

export async function mutatePilotFinance(
  untrustedAction: unknown,
  selectedProductionId: unknown,
): Promise<PersistentMutationResult> {
  if (isDemoMode()) return { ok: false, message: "Persistent pilot mode is not configured." };
  const parsed = mutationSchema.safeParse(untrustedAction);
  const selectedId = id.safeParse(selectedProductionId);
  if (!parsed.success || !selectedId.success) {
    return { ok: false, message: "This change is invalid. Review the fields and try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Pilot mutation session verification failed", { status: authError.status });
    return { ok: false, message: "Your session could not be verified. Sign in again." };
  }
  if (!authData.user) return { ok: false, message: "Sign in before changing pilot financial records." };

  const action = parsed.data;
  let preferredProductionId = selectedId.data;
  let rpcError: { code?: string } | null = null;

  switch (action.type) {
    case "production/update": {
      const { error } = await supabase.rpc("update_production", {
        p_production_id: action.productionId,
        p_name: action.changes.name,
        p_type: action.changes.type,
        p_industry: action.changes.industry,
        p_status: statusForDatabase(action.changes.status),
      });
      rpcError = error;
      break;
    }
    case "production/create": {
      const activeProduction = await supabase
        .from("productions")
        .select("tenant_id")
        .eq("id", preferredProductionId)
        .maybeSingle();
      if (activeProduction.error || !activeProduction.data) {
        return { ok: false, message: "Select an accessible production in the workspace where you want to create this production." };
      }
      const membership = await supabase
        .from("tenant_memberships")
        .select("tenant_id,role")
        .eq("user_id", authData.user.id)
        .eq("tenant_id", activeProduction.data.tenant_id)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      if (membership.error || !membership.data) {
        console.warn("Pilot production creation denied", { code: membership.error?.code });
        return { ok: false, message: "Only a tenant owner or administrator can create a production." };
      }
      const { data, error } = await supabase.rpc("create_production", {
        p_tenant_id: membership.data.tenant_id,
        p_name: action.production.name,
        p_type: action.production.type,
        p_industry: action.production.industry,
        p_department_name: action.department.name,
        p_budget_paise: action.production.originalBudgetPaise,
      });
      rpcError = error;
      if (data) preferredProductionId = data;
      break;
    }
    case "expense/create": {
      const { error } = await supabase.rpc("create_expense", {
        p_production_id: action.expense.productionId,
        p_department_id: action.expense.departmentId,
        p_title: action.expense.title,
        p_vendor_name: action.expense.vendor,
        p_expense_date: action.expense.date,
        p_amount_paise: action.expense.amountPaise,
        p_description: action.expense.description,
      });
      rpcError = error;
      break;
    }
    case "expense/submit": {
      const { error } = await supabase.rpc("submit_expense", { p_expense_id: action.expenseId });
      rpcError = error;
      break;
    }
    case "approval/decide": {
      const { error } = await supabase.rpc("decide_approval", {
        p_approval_id: action.approvalId,
        p_decision: action.decision === "Approved" ? "approved" : "rejected",
      });
      rpcError = error;
      break;
    }
    case "approval/pay": {
      const { error } = await supabase.rpc("record_approval_payment", { p_approval_id: action.approvalId });
      rpcError = error;
      break;
    }
    case "expense/pay": {
      const { error } = await supabase.rpc("record_expense_payment", { p_expense_id: action.expenseId });
      rpcError = error;
      break;
    }
    case "budget/revise": {
      const { error } = await supabase.rpc("revise_budget", {
        p_department_id: action.departmentId,
        p_revised_paise: action.revisedPaise,
      });
      rpcError = error;
      break;
    }
    case "crew/pay": {
      const { error } = await supabase.rpc("record_crew_payment", {
        p_crew_id: action.crewId,
        p_amount_paise: action.amountPaise,
        p_paid_at: action.date,
      });
      rpcError = error;
      break;
    }
  }

  if (rpcError) {
    console.warn("Persistent finance mutation was rejected", { code: rpcError.code });
    return {
      ok: false,
      message: "The change could not be saved. It may be invalid, already completed, or outside your production access.",
    };
  }

  try {
    const state = await loadFinanceState(supabase, authData.user.id, preferredProductionId);
    return { ok: true, state };
  } catch {
    return { ok: false, message: "The change was saved, but refreshed records could not be loaded. Reload the page." };
  }
}

function statusForDatabase(value: "On Track" | "Watch" | "At Risk") {
  return value === "On Track" ? "on_track" : value === "At Risk" ? "at_risk" : "watch";
}

export async function requestPilotAnalysis(
  question: unknown,
  productionId: unknown,
) {
  const questionResult = z.string().trim().min(1).max(500).safeParse(question);
  const productionResult = id.safeParse(productionId);
  if (!questionResult.success || !productionResult.success) {
    throw new Error("Enter a question of 1 to 500 characters and select an accessible production.");
  }
  if (isDemoMode()) throw new Error("Server analysis is available only in authenticated pilot mode.");

  const { answerDemoQuestion } = await import("@/lib/ai-demo");
  const { answerWithProvider, isProviderConfigured } = await import("@/lib/supabase/ai-provider");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in before requesting server-side analysis.");
  const state = await loadFinanceState(supabase, data.user.id, productionResult.data);
  if (!state.productions.some((production) => production.id === productionResult.data)) {
    throw new Error("That production is not available to your account.");
  }

  let providerConfigured: boolean;
  try {
    providerConfigured = isProviderConfigured();
  } catch (providerConfigurationError) {
    console.error("AI provider configuration is incomplete; deterministic fallback is active", {
      error: providerConfigurationError instanceof Error ? providerConfigurationError.name : "UnknownError",
    });
    return {
      ...answerDemoQuestion(questionResult.data, state),
      disclaimer: "AI provider configuration is incomplete. Showing the deterministic financial fallback.",
    };
  }
  if (!providerConfigured) return answerDemoQuestion(questionResult.data, state);
  try {
    return await answerWithProvider(questionResult.data, state, productionResult.data);
  } catch (providerError) {
    console.error("AI provider request failed; deterministic fallback is active", {
      error: providerError instanceof Error ? providerError.name : "UnknownError",
    });
    return {
      ...answerDemoQuestion(questionResult.data, state),
      disclaimer: "The configured AI provider was unavailable or returned an invalid response. Showing the deterministic financial fallback.",
    };
  }
}
