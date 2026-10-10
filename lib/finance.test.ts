import { describe, expect, it } from "vitest";
import { answerDemoQuestion } from "./ai-demo";
import {
  getDepartmentSnapshot,
  getPendingApprovals,
  getProductionSnapshot,
  isForecastOverOriginalBudget,
} from "./finance";
import { createInitialState } from "./demo-state";
import { financeReducer } from "./finance-state";
import type { Expense } from "./types";

const today = "2026-10-10";

describe("financial calculations", () => {
  it("preserves Project Phoenix headline figures in integer paise", () => {
    const state = createInitialState();
    const phoenix = state.productions.find((item) => item.id === "phoenix");
    expect(phoenix).toBeDefined();
    const summary = getProductionSnapshot(state, phoenix!);
    expect(summary.originalBudgetPaise / 100).toBe(100_000_000);
    expect(summary.actualPaise / 100).toBe(48_200_000);
    expect(summary.remainingPaise / 100).toBe(51_800_000);
    expect(phoenix!.burnRatePaise / 100).toBe(1_850_000);
    expect(summary.pendingApprovals).toBe(17);
    expect(summary.forecastPaise / 100).toBe(108_400_000);
    expect(summary.health).toBe("At Risk");
    expect(getProductionSnapshot(state, state.productions.find((item) => item.id === "alpha")!).health).toBe("On Track");
    expect(getProductionSnapshot(state, state.productions.find((item) => item.id === "serial-x")!).health).toBe("Watch");
  });

  it("shows the illustrative Art forecast at ₹16L above original allocation", () => {
    const state = createInitialState();
    const art = state.departments.find((department) => department.id === "art")!;
    expect(getDepartmentSnapshot(state, art).variancePaise / 100).toBe(1_600_000);
  });

  it("updates the production revised-budget total when a department revision is saved", () => {
    let state = createInitialState();
    const before = getProductionSnapshot(state, state.productions[0]);
    state = financeReducer(state, {
      type: "budget/revise",
      departmentId: "art",
      revisedPaise: 1_200_000_000,
    });
    const after = getProductionSnapshot(state, state.productions[0]);
    expect(after.revisedBudgetPaise - before.revisedBudgetPaise).toBe(150_000_000);
    expect(state.departments.find((department) => department.id === "art")?.revisedPaise).toBe(1_200_000_000);
  });

  it("does not alert when a ₹10 lakh budget has no spend, commitments, or forecast inputs", () => {
    const initial = createInitialState();
    const production = {
      ...initial.productions[0],
      originalBudgetPaise: 100_000_000,
      revisedBudgetPaise: 100_000_000,
      baselineActualPaise: 0,
      baselineCommittedPaise: 0,
      baselineForecastPaise: 0,
      baselinePendingApprovals: 0,
    };
    const state = {
      ...initial,
      selectedProductionId: production.id,
      productions: [production],
      departments: [],
      expenses: [],
      approvals: [],
      payments: [],
    };

    const snapshot = getProductionSnapshot(state, production);
    expect(snapshot.originalBudgetPaise).toBe(100_000_000);
    expect(snapshot.actualPaise).toBe(0);
    expect(snapshot.committedPaise).toBe(0);
    expect(snapshot.remainingPaise).toBe(100_000_000);
    expect(snapshot.forecastPaise).toBe(0);
    expect(snapshot.variancePaise).toBe(-100_000_000);
    expect(isForecastOverOriginalBudget(snapshot.forecastPaise, snapshot.originalBudgetPaise)).toBe(false);
  });
});

describe("expense, approval, and payment workflows", () => {
  it("creates, submits, approves and pays an expense once", () => {
    let state = createInitialState();
    const expense: Expense = {
      id: "EXP-TEST",
      productionId: "phoenix",
      title: "Test paint purchase",
      vendor: "Studio Noir",
      departmentId: "art",
      date: today,
      amountPaise: 2_500_000,
      status: "Draft",
      description: "Demo workflow test",
      source: "user",
    };
    state = financeReducer(state, { type: "expense/create", expense });
    state = financeReducer(state, { type: "expense/submit", expenseId: expense.id });
    const approval = state.approvals.find((item) => item.expenseId === expense.id)!;
    expect(getPendingApprovals(state, "phoenix")).toHaveLength(18);
    state = financeReducer(state, {
      type: "approval/decide",
      approvalId: approval.id,
      decision: "Approved",
    });
    expect(state.expenses.find((item) => item.id === expense.id)?.status).toBe("Approved");
    const approvedSummary = getProductionSnapshot(state, state.productions[0]);
    expect(approvedSummary.committedPaise).toBe(1_872_500_000);
    state = financeReducer(state, { type: "expense/pay", expenseId: expense.id });
    expect(state.expenses.find((item) => item.id === expense.id)?.status).toBe("Paid");
    expect(getProductionSnapshot(state, state.productions[0]).actualPaise).toBe(4_822_500_000);
    const duplicate = financeReducer(state, { type: "expense/pay", expenseId: expense.id });
    expect(duplicate.notice?.kind).toBe("error");
    expect(getProductionSnapshot(duplicate, duplicate.productions[0]).actualPaise).toBe(4_822_500_000);
  });

  it("rejects invalid expense transitions without changing accounting totals", () => {
    const state = createInitialState();
    const next = financeReducer(state, { type: "expense/pay", expenseId: "EXP-301" });
    expect(next.expenses.find((item) => item.id === "EXP-301")?.status).toBe("Pending");
    expect(next.notice?.kind).toBe("error");
  });

  it("adds a newly approved demo expense to forecast and commitment, then shifts it to actual when paid", () => {
    let state = createInitialState();
    const initial = getProductionSnapshot(state, state.productions[0]);
    const art = state.departments.find((department) => department.id === "art")!;
    const initialArt = getDepartmentSnapshot(state, art);
    state = financeReducer(state, { type: "approval/decide", approvalId: "APR-154", decision: "Approved" });
    const approved = getProductionSnapshot(state, state.productions[0]);
    const approvedArt = getDepartmentSnapshot(state, art);
    expect(approved.pendingApprovals).toBe(16);
    expect(approved.actualPaise).toBe(initial.actualPaise);
    expect(approved.remainingPaise).toBe(initial.remainingPaise);
    expect(approved.committedPaise - initial.committedPaise).toBe(320_000_000);
    expect(approved.forecastPaise - initial.forecastPaise).toBe(320_000_000);
    expect(approvedArt.actualPaise).toBe(initialArt.actualPaise);
    expect(approvedArt.committedPaise - initialArt.committedPaise).toBe(320_000_000);
    expect(approvedArt.forecastPaise).toBe(1_480_000_000);
    state = financeReducer(state, { type: "expense/pay", expenseId: "EXP-301" });
    const paid = getProductionSnapshot(state, state.productions[0]);
    expect(paid.actualPaise - initial.actualPaise).toBe(320_000_000);
    expect(paid.committedPaise).toBe(initial.committedPaise);
    expect(paid.forecastPaise).toBe(approved.forecastPaise);
    expect(state.approvals.find((approval) => approval.expenseId === "EXP-301")?.status).toBe("Paid");
  });

  it("derives authoritative totals from persisted records without demo baselines", () => {
    const seed = createInitialState();
    const production = {
      ...seed.productions[0],
      baselineActualPaise: 0,
      baselineCommittedPaise: 0,
      baselineForecastPaise: 0,
      baselinePendingApprovals: 0,
    };
    const expense: Expense = {
      id: "00000000-0000-4000-8000-000000000001",
      productionId: production.id,
      title: "Verified unit rental",
      vendor: "Approved vendor",
      departmentId: "art",
      date: today,
      amountPaise: 4_200_000,
      status: "Pending",
      description: "",
      source: "user",
      workflowTouched: true,
    };
    const state = {
      ...seed,
      selectedProductionId: production.id,
      productions: [production],
      departments: seed.departments
        .filter((department) => department.productionId === production.id)
        .map((department) => ({
          ...department,
          baselineActualPaise: 0,
          baselineCommittedPaise: 0,
          baselineForecastPaise: 0,
        })),
      expenses: [expense],
      approvals: [{
        id: "00000000-0000-4000-8000-000000000002",
        productionId: production.id,
        expenseId: expense.id,
        title: expense.title,
        owner: "Finance",
        amountPaise: expense.amountPaise,
        priority: "Medium" as const,
        status: "Pending" as const,
        rationale: "Awaiting review.",
      }],
    };
    const before = getProductionSnapshot(state, production);
    expect(before.actualPaise).toBe(0);
    expect(before.committedPaise).toBe(4_200_000);
    expect(before.forecastPaise).toBe(4_200_000);
    expect(before.pendingApprovals).toBe(1);

    const approvedState = financeReducer(state, {
      type: "approval/decide",
      approvalId: "00000000-0000-4000-8000-000000000002",
      decision: "Approved",
    });
    const approved = getProductionSnapshot(approvedState, production);
    expect(approved.actualPaise).toBe(0);
    expect(approved.committedPaise).toBe(4_200_000);
    expect(approved.forecastPaise).toBe(4_200_000);
    expect(approved.pendingApprovals).toBe(0);

    const paidState = financeReducer(approvedState, {
      type: "expense/pay",
      expenseId: expense.id,
    });
    const paid = getProductionSnapshot(paidState, production);
    expect(paid.actualPaise).toBe(4_200_000);
    expect(paid.committedPaise).toBe(0);
    expect(paid.forecastPaise).toBe(4_200_000);
    expect(paidState.approvals[0].status).toBe("Paid");
  });

  it("tracks approved standalone requests as commitments until payment", () => {
    let state = createInitialState();
    const initial = getProductionSnapshot(state, state.productions[0]);
    state = financeReducer(state, { type: "approval/decide", approvalId: "APR-178", decision: "Approved" });
    const approved = getProductionSnapshot(state, state.productions[0]);
    expect(approved.committedPaise - initial.committedPaise).toBe(420_000_000);
    expect(approved.forecastPaise - initial.forecastPaise).toBe(420_000_000);
    state = financeReducer(state, { type: "approval/pay", approvalId: "APR-178" });
    const paid = getProductionSnapshot(state, state.productions[0]);
    expect(paid.actualPaise - initial.actualPaise).toBe(420_000_000);
    expect(paid.committedPaise).toBe(initial.committedPaise);
    const duplicate = financeReducer(state, { type: "approval/pay", approvalId: "APR-178" });
    expect(duplicate.notice?.kind).toBe("error");
  });

  it("records crew payment without allowing overpayment", () => {
    let state = createInitialState();
    state = financeReducer(state, {
      type: "crew/pay",
      crewId: "crew-karan",
      amountPaise: 1_000_000,
      date: today,
    });
    expect(state.crew.find((person) => person.id === "crew-karan")?.paidPaise).toBe(1_000_000);
    expect(state.payments.reduce((total, payment) => total + payment.amountPaise, 0)).toBe(1_000_000);
    const invalid = financeReducer(state, {
      type: "crew/pay",
      crewId: "crew-karan",
      amountPaise: 32_000_000,
      date: today,
    });
    expect(invalid.notice?.kind).toBe("error");
    expect(invalid.payments).toHaveLength(1);
  });
});

describe("production context and AI demo", () => {
  it("switches production context without mixing expense records", () => {
    const state = financeReducer(createInitialState(), {
      type: "production/select",
      productionId: "alpha",
    });
    expect(state.selectedProductionId).toBe("alpha");
    expect(state.expenses.filter((item) => item.productionId === state.selectedProductionId)).toHaveLength(1);
  });

  it("keeps the visible approval fixture count aligned to each production's headline count", () => {
    const state = createInitialState();
    for (const production of state.productions) {
      expect(getPendingApprovals(state, production.id)).toHaveLength(production.baselinePendingApprovals);
    }
  });

  it("creates a production-specific budget context and rejects duplicate names", () => {
    let state = createInitialState();
    const production = {
      id: "orion",
      name: "Project Orion",
      type: "Feature Film",
      industry: "South Indian Film",
      status: "On Track" as const,
      originalBudgetPaise: 500_000_000,
      revisedBudgetPaise: 500_000_000,
      baselineActualPaise: 0,
      baselineCommittedPaise: 0,
      baselineForecastPaise: 0,
      burnRatePaise: 0,
      baselinePendingApprovals: 0,
      createdAt: today,
    };
    state = financeReducer(state, {
      type: "production/create",
      production,
      department: {
        id: "orion-general",
        productionId: "orion",
        name: "General",
        originalPaise: 500_000_000,
        revisedPaise: 500_000_000,
        baselineActualPaise: 0,
        baselineCommittedPaise: 0,
        baselineForecastPaise: 0,
      },
    });
    expect(state.selectedProductionId).toBe("orion");
    expect(state.expenses.filter((item) => item.productionId === "orion")).toHaveLength(0);
    const duplicate = financeReducer(state, {
      type: "production/create",
      production: { ...production, id: "orion-copy", name: "Project ORION" },
      department: { ...state.departments.at(-1)!, id: "orion-copy-general", productionId: "orion-copy" },
    });
    expect(duplicate.notice?.kind).toBe("error");
    expect(duplicate.productions).toHaveLength(state.productions.length);
  });

  it("responds to Art questions using the supplied forecast and transparent evidence", () => {
    const response = answerDemoQuestion("Why is Art at risk?", createInitialState());
    expect(response.answer).toContain("₹16 L");
    expect(response.evidence).toContain("Original allocation: ₹1.00 Cr");
    expect(response.disclaimer).toContain("Rule-based demo response");
  });

  it("falls back to summary analysis for unrecognized questions", () => {
    const response = answerDemoQuestion("What should I know?", createInitialState());
    expect(response.title).toContain("Project Phoenix");
    expect(response.answer).toContain("₹10.84 Cr");
  });
});
