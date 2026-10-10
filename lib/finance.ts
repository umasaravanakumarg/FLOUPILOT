import type {
  Approval,
  DepartmentBudget,
  Expense,
  FinanceState,
  Production,
} from "./types";

export interface DepartmentSnapshot extends DepartmentBudget {
  actualPaise: number;
  committedPaise: number;
  forecastPaise: number;
  remainingPaise: number;
  variancePaise: number;
}

export interface ProductionSnapshot {
  originalBudgetPaise: number;
  revisedBudgetPaise: number;
  actualPaise: number;
  committedPaise: number;
  remainingPaise: number;
  forecastPaise: number;
  variancePaise: number;
  pendingApprovals: number;
  health: Production["status"];
}

export function isForecastOverOriginalBudget(
  forecastPaise: number,
  originalBudgetPaise: number,
): boolean {
  return forecastPaise > originalBudgetPaise;
}

const affectsFinance = (expense: Expense) =>
  expense.source === "user" || expense.workflowTouched === true;

export function getDepartmentSnapshot(
  state: FinanceState,
  department: DepartmentBudget,
): DepartmentSnapshot {
  const userExpenses = state.expenses.filter(
    (expense) =>
      expense.productionId === department.productionId &&
      expense.departmentId === department.id &&
      affectsFinance(expense) &&
      expense.status !== "Rejected" &&
      expense.status !== "Draft",
  );
  const expenseActual = userExpenses
    .filter((expense) => expense.status === "Paid")
    .reduce((sum, expense) => sum + expense.amountPaise, 0);
  const expenseCommitment = userExpenses
    .filter((expense) => expense.status === "Pending" || expense.status === "Approved")
    .reduce((sum, expense) => sum + expense.amountPaise, 0);
  const userPayments = state.payments
    .filter((payment) => payment.productionId === department.productionId)
    .filter((payment) =>
      state.crew.some(
        (member) => member.id === payment.crewId && member.departmentId === department.id,
      ),
    )
    .reduce((sum, payment) => sum + payment.amountPaise, 0);
  const forecastPaise =
    department.baselineForecastPaise +
    userExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0);
  const actualPaise = department.baselineActualPaise + expenseActual + userPayments;
  const committedPaise = Math.max(
    0,
    department.baselineCommittedPaise + expenseCommitment - userPayments,
  );
  return {
    ...department,
    actualPaise,
    committedPaise,
    forecastPaise,
    remainingPaise: department.revisedPaise - actualPaise - committedPaise,
    variancePaise: forecastPaise - department.originalPaise,
  };
}

export function getProductionSnapshot(
  state: FinanceState,
  production: Production,
): ProductionSnapshot {
  const incrementalExpenses = state.expenses.filter(
    (expense) =>
      expense.productionId === production.id &&
      affectsFinance(expense) &&
      expense.status !== "Rejected" &&
      expense.status !== "Draft",
  );
  const userPaidExpenses = incrementalExpenses
    .filter((expense) => expense.status === "Paid")
    .reduce((sum, expense) => sum + expense.amountPaise, 0);
  const userCommitments = incrementalExpenses
    .filter((expense) => expense.status === "Pending" || expense.status === "Approved")
    .reduce((sum, expense) => sum + expense.amountPaise, 0);
  const userPayments = state.payments
    .filter((payment) => payment.productionId === production.id)
    .reduce((sum, payment) => sum + payment.amountPaise, 0);
  const decidedBaselineApprovals = state.approvals.filter(
    (approval) =>
      approval.productionId === production.id &&
      approval.status !== "Pending" &&
      !state.expenses.some((expense) => expense.id === approval.expenseId && expense.source === "user"),
  ).length;
  const additionalPendingApprovals = state.approvals.filter(
    (approval) =>
      approval.productionId === production.id &&
      approval.status === "Pending" &&
      state.expenses.some((expense) => expense.id === approval.expenseId && expense.source === "user"),
  ).length;
  const standaloneApprovalPaise = state.approvals
    .filter((approval) => approval.productionId === production.id && !approval.expenseId)
    .filter((approval) => approval.status === "Approved" || approval.status === "Paid")
    .reduce((sum, approval) => sum + approval.amountPaise, 0);
  const standalonePaidPaise = state.approvals
    .filter((approval) => approval.productionId === production.id && !approval.expenseId && approval.status === "Paid")
    .reduce((sum, approval) => sum + approval.amountPaise, 0);
  const actualPaise =
    production.baselineActualPaise + userPaidExpenses + userPayments + standalonePaidPaise;
  const committedPaise = Math.max(
    0,
    production.baselineCommittedPaise + userCommitments + standaloneApprovalPaise - standalonePaidPaise - userPayments,
  );
  const forecastPaise =
    production.baselineForecastPaise +
    incrementalExpenses.reduce((sum, expense) => sum + expense.amountPaise, 0) +
    standaloneApprovalPaise;
  const variancePaise = forecastPaise - production.originalBudgetPaise;
  const revisedBudgetPaise =
    production.revisedBudgetPaise +
    (state.budgetRevisionDeltaPaise[production.id] ?? 0);
  const revisedVariancePaise = forecastPaise - revisedBudgetPaise;
  const pendingApprovals = production.baselinePendingApprovals === 0
    ? state.approvals.filter(
        (approval) =>
          approval.productionId === production.id && approval.status === "Pending",
      ).length
    : Math.max(
        0,
        production.baselinePendingApprovals -
          decidedBaselineApprovals +
          additionalPendingApprovals,
      );
  return {
    originalBudgetPaise: production.originalBudgetPaise,
    revisedBudgetPaise,
    actualPaise,
    committedPaise,
    remainingPaise: production.originalBudgetPaise - actualPaise,
    forecastPaise,
    variancePaise,
    pendingApprovals,
    health:
      revisedVariancePaise > production.originalBudgetPaise * 0.05
        ? "At Risk"
        : revisedVariancePaise > 0
          ? "Watch"
          : "On Track",
  };
}

export function getPendingApprovals(state: FinanceState, productionId: string): Approval[] {
  return state.approvals.filter(
    (approval) =>
      approval.productionId === productionId && approval.status === "Pending",
  );
}

export function getAvailableCrewPayment(
  state: FinanceState,
  crewId: string,
): number {
  const member = state.crew.find((crew) => crew.id === crewId);
  return member ? member.duePaise - member.paidPaise : 0;
}
