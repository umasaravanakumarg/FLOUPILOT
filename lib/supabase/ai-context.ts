import { getDepartmentSnapshot, getProductionSnapshot } from "../finance";
import type { FinanceState } from "../types";

export function buildAiContext(state: FinanceState, productionId: string) {
  const production = state.productions.find((item) => item.id === productionId);
  if (!production) throw new Error("Production is not available.");

  const snapshot = getProductionSnapshot(state, production);
  const departments = state.departments
    .filter((department) => department.productionId === productionId)
    .slice(0, 12)
    .map((department) => {
      const result = getDepartmentSnapshot(state, department);
      return {
        name: department.name,
        originalPaise: result.originalPaise,
        revisedPaise: result.revisedPaise,
        actualPaise: result.actualPaise,
        committedPaise: result.committedPaise,
        forecastPaise: result.forecastPaise,
        variancePaise: result.variancePaise,
      };
    });

  return {
    production: {
      name: production.name,
      originalBudgetPaise: snapshot.originalBudgetPaise,
      revisedBudgetPaise: snapshot.revisedBudgetPaise,
      actualPaise: snapshot.actualPaise,
      committedPaise: snapshot.committedPaise,
      remainingPaise: snapshot.remainingPaise,
      forecastPaise: snapshot.forecastPaise,
      variancePaise: snapshot.variancePaise,
      pendingApprovals: snapshot.pendingApprovals,
    },
    departments,
    pendingApprovals: state.approvals
      .filter((approval) => approval.productionId === productionId && approval.status === "Pending")
      .slice(0, 8)
      .map(({ id, title, amountPaise, priority }) => ({ id, title, amountPaise, priority })),
    recentExpenses: state.expenses
      .filter((expense) => expense.productionId === productionId)
      .slice(-8)
      .map(({ id, title, vendor, departmentId, amountPaise, status }) => ({
        id,
        title,
        vendor,
        departmentId,
        amountPaise,
        status,
      })),
  };
}
