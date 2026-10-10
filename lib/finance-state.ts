import type {
  Approval,
  Expense,
  FinanceAction,
  FinanceState,
} from "./types";

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function notice(state: FinanceState, message: string): FinanceState {
  return { ...state, notice: { message, kind: "error" }, revision: state.revision + 1 };
}

function success(state: FinanceState, message: string): FinanceState {
  return { ...state, notice: { message, kind: "success" }, revision: state.revision + 1 };
}

function appendActivity(state: FinanceState, productionId: string, message: string) {
  return [
    { id: id("ACT"), message, at: today(), productionId },
    ...state.activity,
  ].slice(0, 30);
}

export function financeReducer(
  state: FinanceState,
  action: FinanceAction,
): FinanceState {
  if (action.type === "notice/clear") {
    return { ...state, notice: undefined };
  }
  if (action.type === "notice/show") {
    return { ...state, notice: { message: action.message, kind: action.kind } };
  }
  if (action.type === "state/restore") {
    return {
      ...action.state,
      budgetRevisionDeltaPaise: action.state.budgetRevisionDeltaPaise ?? {},
      notice: undefined,
    };
  }
  switch (action.type) {
    case "production/select": {
      if (!state.productions.some((production) => production.id === action.productionId)) {
        return notice(state, "That production could not be found.");
      }
      return { ...state, selectedProductionId: action.productionId, revision: state.revision + 1 };
    }
    case "production/update": {
      const production = state.productions.find((item) => item.id === action.productionId);
      if (!production || !action.changes.name.trim() || !action.changes.industry.trim()) {
        return notice(state, "Production name and industry are required.");
      }
      if (
        state.productions.some(
          (item) =>
            item.id !== production.id &&
            item.name.trim().toLowerCase() === action.changes.name.trim().toLowerCase(),
        )
      ) {
        return notice(state, "A production with this name already exists.");
      }
      return success(
        {
          ...state,
          productions: state.productions.map((item) =>
            item.id === production.id ? { ...item, ...action.changes } : item,
          ),
          activity: appendActivity(state, production.id, `Updated production details for ${action.changes.name}`),
        },
        "Production details updated.",
      );
    }
    case "production/create": {
      if (
        state.productions.some(
          (production) => production.name.trim().toLowerCase() === action.production.name.trim().toLowerCase(),
        )
      ) {
        return notice(state, "A production with this name already exists.");
      }
      if (
        !action.production.id.trim() ||
        state.productions.some((production) => production.id === action.production.id) ||
        !action.production.name.trim() ||
        !action.production.type.trim() ||
        !action.production.industry.trim() ||
        !Number.isSafeInteger(action.production.originalBudgetPaise) ||
        action.production.originalBudgetPaise <= 0 ||
        action.department.productionId !== action.production.id ||
        state.departments.some((department) => department.id === action.department.id)
      ) {
        return notice(state, "Production name and a positive budget are required.");
      }
      return success(
        {
          ...state,
          productions: [...state.productions, action.production],
          departments: [...state.departments, action.department],
          selectedProductionId: action.production.id,
          activity: appendActivity(state, action.production.id, `Created ${action.production.name}`),
        },
        `${action.production.name} created.`,
      );
    }
    case "expense/create": {
      if (
        !action.expense.title.trim() ||
        !action.expense.vendor.trim() ||
        action.expense.amountPaise <= 0 ||
        !state.departments.some(
          (department) =>
            department.id === action.expense.departmentId &&
            department.productionId === action.expense.productionId,
        )
      ) {
        return notice(state, "Enter a valid expense and select a department for this production.");
      }
      if (state.expenses.some((expense) => expense.id === action.expense.id)) {
        return notice(state, "This expense already exists.");
      }
      return success(
        {
          ...state,
          expenses: [...state.expenses, action.expense],
          activity: appendActivity(state, action.expense.productionId, `Created expense: ${action.expense.title}`),
        },
        "Expense saved as a draft.",
      );
    }
    case "expense/submit": {
      const expense = state.expenses.find((item) => item.id === action.expenseId);
      if (!expense || expense.status !== "Draft") {
        return notice(state, "Only a saved draft expense can be submitted.");
      }
      const approval: Approval = {
        id: id("APR"),
        productionId: expense.productionId,
        expenseId: expense.id,
        title: expense.title,
        owner: "Production Finance",
        amountPaise: expense.amountPaise,
        priority: "Medium",
        status: "Pending",
        rationale: "Submitted expense awaiting producer approval.",
      };
      return success(
        {
          ...state,
          expenses: state.expenses.map((item) =>
            item.id === expense.id ? { ...item, status: "Pending", workflowTouched: true } : item,
          ),
          approvals: [...state.approvals, approval],
          activity: appendActivity(state, expense.productionId, `Submitted ${expense.title} for approval`),
        },
        "Expense submitted for approval.",
      );
    }
    case "approval/decide": {
      const approval = state.approvals.find((item) => item.id === action.approvalId);
      if (!approval || approval.status !== "Pending") {
        return notice(state, "This approval is no longer pending.");
      }
      const expenses = approval.expenseId
        ? state.expenses.map((expense) =>
            expense.id === approval.expenseId && expense.status === "Pending"
              ? { ...expense, status: action.decision, workflowTouched: true }
              : expense,
          )
        : state.expenses;
      return success(
        {
          ...state,
          approvals: state.approvals.map((item) =>
            item.id === approval.id ? { ...item, status: action.decision } : item,
          ),
          expenses,
          activity: appendActivity(
            state,
            approval.productionId,
            `${action.decision} approval: ${approval.title}`,
          ),
        },
        `Approval ${action.decision.toLowerCase()}.`,
      );
    }
    case "approval/pay": {
      const approval = state.approvals.find((item) => item.id === action.approvalId);
      if (!approval || approval.status !== "Approved" || approval.expenseId) {
        return notice(state, "Only approved requests without a linked expense can be paid here.");
      }
      return success(
        {
          ...state,
          approvals: state.approvals.map((item) =>
            item.id === approval.id ? { ...item, status: "Paid" } : item,
          ),
          activity: appendActivity(state, approval.productionId, `Recorded payment for approval: ${approval.title}`),
        },
        `Payment recorded for ${approval.title}.`,
      );
    }
    case "expense/pay": {
      const expense = state.expenses.find((item) => item.id === action.expenseId);
      if (!expense || expense.status !== "Approved") {
        return notice(state, "Only approved expenses can be marked as paid.");
      }
      return success(
        {
          ...state,
          expenses: state.expenses.map((item) =>
            item.id === expense.id ? { ...item, status: "Paid", workflowTouched: true } : item,
          ),
          approvals: state.approvals.map((item) =>
            item.expenseId === expense.id && item.status === "Approved"
              ? { ...item, status: "Paid" }
              : item,
          ),
          activity: appendActivity(state, expense.productionId, `Recorded payment for ${expense.title}`),
        },
        "Expense payment recorded.",
      );
    }
    case "budget/revise": {
      const department = state.departments.find(
        (item) => item.id === action.departmentId && item.productionId === state.selectedProductionId,
      );
      if (!department || !Number.isSafeInteger(action.revisedPaise) || action.revisedPaise <= 0) {
        return notice(state, "Enter a positive whole-paise revised budget.");
      }
      return success(
        {
          ...state,
          departments: state.departments.map((item) =>
            item.id === department.id ? { ...item, revisedPaise: action.revisedPaise } : item,
          ),
          budgetRevisionDeltaPaise: {
            ...state.budgetRevisionDeltaPaise,
            [department.productionId]:
              (state.budgetRevisionDeltaPaise[department.productionId] ?? 0) +
              action.revisedPaise -
              department.revisedPaise,
          },
          activity: appendActivity(state, department.productionId, `Revised ${department.name} budget`),
        },
        `${department.name} budget revised.`,
      );
    }
    case "crew/pay": {
      const member = state.crew.find(
        (person) =>
          person.id === action.crewId &&
          person.productionId === state.selectedProductionId,
      );
      if (!member || !Number.isSafeInteger(action.amountPaise) || action.amountPaise <= 0) {
        return notice(state, "Enter a positive payment for a crew member in the selected production.");
      }
      if (member.paidPaise + action.amountPaise > member.duePaise) {
        return notice(state, "Payment exceeds this crew member's outstanding amount.");
      }
      const payment = {
        id: id("PAY"),
        productionId: member.productionId,
        crewId: member.id,
        amountPaise: action.amountPaise,
        date: action.date,
      };
      return success(
        {
          ...state,
          crew: state.crew.map((person) =>
            person.id === member.id
              ? { ...person, paidPaise: person.paidPaise + action.amountPaise }
              : person,
          ),
          payments: [...state.payments, payment],
          activity: appendActivity(state, member.productionId, `Recorded crew payment: ${member.name}`),
        },
        `Payment recorded for ${member.name}.`,
      );
    }
  }
}

export function createExpenseId() {
  return id("EXP");
}

export function makeDemoProductionId(name: string, existing: string[]) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let candidate = base || "production";
  let suffix = 2;
  while (existing.includes(candidate)) {
    candidate = `${base || "production"}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function makeDraftExpense(input: Omit<Expense, "id" | "status" | "source">): Expense {
  return { ...input, id: createExpenseId(), status: "Draft", source: "user" };
}
