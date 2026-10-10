import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceState, ProductionStatus } from "@/lib/types";
import type { Database, Json } from "./database.types";

type Client = SupabaseClient<Database>;

const paise = (value: number | string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error("A stored financial amount is outside the supported integer-paise range.");
  }
  return parsed;
};

function assertQuery<T>(result: { data: T | null; error: { code?: string } | null }): T {
  if (result.error || result.data === null) {
    console.error("Supabase data query failed", { code: result.error?.code });
    throw new Error("Pilot records could not be loaded.");
  }
  return result.data;
}

function statusFromDatabase(status: "on_track" | "watch" | "at_risk"): ProductionStatus {
  return status === "on_track" ? "On Track" : status === "at_risk" ? "At Risk" : "Watch";
}

function auditMessage(action: string, entity: string) {
  const verb = action === "insert"
    ? "Created"
    : action === "update"
      ? "Updated"
      : "Removed";
  return `${verb} ${entity.replaceAll("_", " ")}`;
}

export async function loadFinanceState(
  supabase: Client,
  userId: string,
  preferredProductionId?: string,
): Promise<FinanceState> {
  const memberships = assertQuery(
    await supabase
      .from("tenant_memberships")
      .select("tenant_id,role")
      .eq("user_id", userId),
  );
  if (!memberships.length) return emptyState();

  const productionResult = await supabase
    .from("productions")
    .select("id,tenant_id,name,production_type,industry,status,created_at")
    .order("created_at", { ascending: true });
  const productionRows = assertQuery(productionResult);
  if (!productionRows.length) return emptyState();
  const productionIds = productionRows.map((row) => row.id);

  const [departmentResult, budgetResult, expenseResult, approvalResult, vendorResult, crewResult, paymentResult, auditResult] =
    await Promise.all([
      supabase.from("departments").select("id,tenant_id,production_id,name").in("production_id", productionIds),
      supabase.from("budget_allocations").select("id,tenant_id,production_id,department_id,original_paise,revised_paise,updated_at").in("production_id", productionIds),
      supabase.from("expenses").select("id,tenant_id,production_id,department_id,vendor_id,vendor_name,title,description,expense_date,amount_paise,status,created_by,created_at").in("production_id", productionIds),
      supabase.from("approvals").select("id,tenant_id,production_id,expense_id,title,owner,amount_paise,priority,status,rationale,decided_by,decided_at,created_at").in("production_id", productionIds),
      supabase.from("vendors").select("id,tenant_id,production_id,name,category,contact,risk,created_at").in("production_id", productionIds),
      supabase.from("crew_members").select("id,tenant_id,production_id,department_id,name,role,due_paise,next_payment_date,created_at").in("production_id", productionIds),
      supabase.from("payments").select("id,tenant_id,production_id,expense_id,approval_id,crew_id,amount_paise,paid_at,recorded_by,created_at").in("production_id", productionIds),
      supabase.from("audit_events").select("id,tenant_id,production_id,actor_id,entity_type,entity_id,action,old_values,new_values,created_at").in("production_id", productionIds).order("created_at", { ascending: false }).limit(100),
    ]);
  const departments = assertQuery(departmentResult);
  const budgets = assertQuery(budgetResult);
  const expenses = assertQuery(expenseResult);
  const approvals = assertQuery(approvalResult);
  const vendors = assertQuery(vendorResult);
  const crew = assertQuery(crewResult);
  const payments = assertQuery(paymentResult);
  const auditEvents = assertQuery(auditResult);

  const departmentsByProduction = new Map<string, typeof departments>();
  for (const department of departments) {
    const rows = departmentsByProduction.get(department.production_id) ?? [];
    rows.push(department);
    departmentsByProduction.set(department.production_id, rows);
  }
  const budgetsByDepartment = new Map(budgets.map((budget) => [budget.department_id, budget]));
  const crewPayments = payments.filter((payment) => payment.crew_id !== null);

  return {
    selectedProductionId: productionRows.some((production) => production.id === preferredProductionId)
      ? preferredProductionId!
      : productionRows[0].id,
    productions: productionRows.map((production) => {
      const allocations = (departmentsByProduction.get(production.id) ?? [])
        .map((department) => budgetsByDepartment.get(department.id))
        .filter((budget) => budget !== undefined);
      return {
        id: production.id,
        name: production.name,
        type: production.production_type,
        industry: production.industry,
        status: statusFromDatabase(production.status),
        originalBudgetPaise: allocations.reduce((sum, budget) => sum + paise(budget.original_paise), 0),
        revisedBudgetPaise: allocations.reduce((sum, budget) => sum + paise(budget.revised_paise), 0),
        baselineActualPaise: 0,
        baselineCommittedPaise: 0,
        baselineForecastPaise: 0,
        burnRatePaise: 0,
        baselinePendingApprovals: 0,
        createdAt: production.created_at.slice(0, 10),
      };
    }),
    departments: departments.map((department) => {
      const budget = budgetsByDepartment.get(department.id);
      return {
        id: department.id,
        productionId: department.production_id,
        name: department.name,
        originalPaise: paise(budget?.original_paise ?? 0),
        revisedPaise: paise(budget?.revised_paise ?? 0),
        baselineActualPaise: 0,
        baselineCommittedPaise: 0,
        baselineForecastPaise: 0,
      };
    }),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      productionId: expense.production_id,
      title: expense.title,
      vendor: expense.vendor_name,
      departmentId: expense.department_id,
      date: expense.expense_date,
      amountPaise: paise(expense.amount_paise),
      status: titleCase(expense.status) as FinanceState["expenses"][number]["status"],
      description: expense.description,
      source: "user" as const,
      workflowTouched: expense.status !== "draft",
    })),
    approvals: approvals.map((approval) => ({
      id: approval.id,
      productionId: approval.production_id,
      ...(approval.expense_id ? { expenseId: approval.expense_id } : {}),
      title: approval.title,
      owner: approval.owner,
      amountPaise: paise(approval.amount_paise),
      priority: titleCase(approval.priority) as FinanceState["approvals"][number]["priority"],
      status: titleCase(approval.status) as FinanceState["approvals"][number]["status"],
      rationale: approval.rationale,
    })),
    vendors: vendors.map((vendor) => ({
      id: vendor.id,
      productionId: vendor.production_id,
      name: vendor.name,
      category: vendor.category,
      contact: vendor.contact ?? "",
      risk: titleCase(vendor.risk) as FinanceState["vendors"][number]["risk"],
    })),
    crew: crew.map((member) => ({
      id: member.id,
      productionId: member.production_id,
      name: member.name,
      role: member.role,
      departmentId: member.department_id,
      duePaise: paise(member.due_paise),
      paidPaise: crewPayments
        .filter((payment) => payment.crew_id === member.id)
        .reduce((sum, payment) => sum + paise(payment.amount_paise), 0),
      nextPaymentDate: member.next_payment_date ?? "",
    })),
    payments: crewPayments.map((payment) => ({
      id: payment.id,
      productionId: payment.production_id,
      crewId: payment.crew_id!,
      amountPaise: paise(payment.amount_paise),
      date: payment.paid_at,
    })),
    activity: auditEvents.map((event) => ({
      id: event.id,
      message: `${auditMessage(event.action, event.entity_type)} · ${summarizeAuditChange(event.new_values)}`,
      at: event.created_at.slice(0, 10),
      productionId: event.production_id,
    })),
    budgetRevisionDeltaPaise: {},
    revision: 0,
  };
}

function emptyState(): FinanceState {
  return {
    selectedProductionId: "",
    productions: [],
    departments: [],
    expenses: [],
    approvals: [],
    vendors: [],
    crew: [],
    payments: [],
    activity: [],
    budgetRevisionDeltaPaise: {},
    revision: 0,
  };
}

function titleCase(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

function summarizeAuditChange(value: Json | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") return "record";
  const record = value as Record<string, Json | undefined>;
  const name = record.name ?? record.title;
  return typeof name === "string" ? name.slice(0, 100) : "record";
}
