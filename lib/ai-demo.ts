import {
  getDepartmentSnapshot,
  getProductionSnapshot,
} from "./finance";
import type { FinanceState } from "./types";

export interface AiResponse {
  title: string;
  answer: string;
  evidence: string[];
  actions: { label: string; module: "budget" | "expenses" | "approvals" }[];
  disclaimer: string;
}

export function answerDemoQuestion(
  question: string,
  state: FinanceState,
): AiResponse {
  const production = state.productions.find(
    (item) => item.id === state.selectedProductionId,
  );
  if (!production) {
    return {
      title: "Production unavailable",
      answer: "Select a production to see its financial analysis.",
      evidence: [],
      actions: [],
      disclaimer: "Deterministic demo analysis; no external AI service is connected.",
    };
  }
  const snapshot = getProductionSnapshot(state, production);
  const normalized = question.toLowerCase();
  const art = state.departments.find(
    (department) =>
      department.productionId === production.id &&
      (department.id === "art" || department.name.toLowerCase().includes("art")),
  );
  const artSnapshot = art ? getDepartmentSnapshot(state, art) : undefined;
  const relevantExpenses = state.expenses.filter(
    (expense) =>
      expense.productionId === production.id &&
      (!art || expense.departmentId === art.id) &&
      expense.status !== "Rejected",
  );
  const pending = state.approvals.filter(
    (approval) =>
      approval.productionId === production.id && approval.status === "Pending",
  );

  if (/art|set|department/.test(normalized) && art && artSnapshot) {
    return {
      title: `${art.name}: forecast pressure`,
      answer: `The current illustrative department forecast is ${formatCr(artSnapshot.forecastPaise)} against an original allocation of ${formatCr(art.originalPaise)}. The forecast is ${formatLakhs(artSnapshot.variancePaise)} ${artSnapshot.variancePaise >= 0 ? "over" : "under"} the original allocation. The department forecast is a planning assumption, not a sum of the sample ledger rows.`,
      evidence: [
        `Original allocation: ${formatCr(art.originalPaise)}`,
        `Revised allocation: ${formatCr(art.revisedPaise)}`,
        `Forecast variance: ${formatLakhs(artSnapshot.variancePaise)} ${artSnapshot.variancePaise >= 0 ? "over" : "under"} the original allocation`,
        `Open Art-related approvals: ${pending.filter((item) => item.owner.toLowerCase().includes("art") || item.expenseId && relevantExpenses.some((expense) => expense.id === item.expenseId)).length}`,
      ],
      actions: [
        { label: "Review Art budget", module: "budget" },
        { label: "Inspect Art expenses", module: "expenses" },
      ],
      disclaimer: "Rule-based demo response calculated from this workspace's fixture and user-entered data.",
    };
  }
  if (/approval|pending|approve/.test(normalized)) {
    return {
      title: `${snapshot.pendingApprovals} pending approvals`,
      answer: `There are ${snapshot.pendingApprovals} pending approvals in ${production.name}. The visible queue contains ${pending.length} open items. Review high-priority requests first; approving one changes commitments, while payment must be recorded separately.`,
      evidence: pending
        .slice(0, 3)
        .map((item) => `${item.title}: ${formatRupees(item.amountPaise)} (${item.priority} priority)`),
      actions: [{ label: "Open approval queue", module: "approvals" }],
      disclaimer: "Rule-based demo response calculated from this workspace's fixture and user-entered data.",
    };
  }
  if (/expense|ledger|invoice|transaction/.test(normalized)) {
    const recent = relevantExpenses.slice(0, 3);
    return {
      title: "Expense ledger context",
      answer: `The sample expense ledger contains ${relevantExpenses.length} ${art ? "Art department " : ""}rows. These example rows are not a complete accounting ledger and are not reconciled to the production's reported actual spend.`,
      evidence: recent.map(
        (expense) =>
          `${expense.title}: ${formatRupees(expense.amountPaise)} · ${expense.status}`,
      ),
      actions: [{ label: "Inspect expenses", module: "expenses" }],
      disclaimer: "No OCR or external AI is running; this response uses known demo records only.",
    };
  }
  return {
    title: `${production.name} financial outlook`,
    answer: `The supplied production summary reports ${formatCr(snapshot.actualPaise)} actual spend against a ${formatCr(snapshot.originalBudgetPaise)} original budget, with a ${formatCr(snapshot.forecastPaise)} forecast. The forecast is ${formatLakhs(snapshot.variancePaise)} ${snapshot.variancePaise >= 0 ? "over" : "under"} the original allocation. Commitments are shown separately and are not added again to the forecast.`,
    evidence: [
      `Original budget: ${formatCr(snapshot.originalBudgetPaise)}`,
      `Actual spend: ${formatCr(snapshot.actualPaise)}`,
      `Committed obligations: ${formatCr(snapshot.committedPaise)}`,
      `Forecast: ${formatCr(snapshot.forecastPaise)}`,
      `Pending approvals: ${snapshot.pendingApprovals}`,
    ],
    actions: [{ label: "Review budget", module: "budget" }],
    disclaimer: "Rule-based demo response calculated from this workspace's fixture and user-entered data.",
  };
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatCr(paise: number) {
  return `₹${(paise / 100 / 10_000_000).toFixed(2)} Cr`;
}

function formatLakhs(paise: number) {
  return `₹${(Math.abs(paise) / 100 / 100_000).toFixed(0)} L`;
}
