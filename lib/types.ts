export type ModuleId =
  | "dashboard"
  | "productions"
  | "budget"
  | "expenses"
  | "approvals"
  | "vendors"
  | "crew"
  | "reports"
  | "ai"
  | "settings";

export type ProductionStatus = "On Track" | "Watch" | "At Risk";
export type ExpenseStatus = "Draft" | "Pending" | "Approved" | "Rejected" | "Paid";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Paid";

export interface Production {
  id: string;
  name: string;
  type: string;
  industry: string;
  status: ProductionStatus;
  originalBudgetPaise: number;
  revisedBudgetPaise: number;
  baselineActualPaise: number;
  baselineCommittedPaise: number;
  baselineForecastPaise: number;
  burnRatePaise: number;
  baselinePendingApprovals: number;
  createdAt: string;
}

export interface DepartmentBudget {
  id: string;
  productionId: string;
  name: string;
  originalPaise: number;
  revisedPaise: number;
  baselineActualPaise: number;
  baselineCommittedPaise: number;
  baselineForecastPaise: number;
}

export interface Expense {
  id: string;
  productionId: string;
  title: string;
  vendor: string;
  departmentId: string;
  date: string;
  amountPaise: number;
  status: ExpenseStatus;
  description: string;
  source: "demo" | "user";
  workflowTouched?: boolean;
}

export interface Approval {
  id: string;
  productionId: string;
  expenseId?: string;
  title: string;
  owner: string;
  amountPaise: number;
  priority: "High" | "Medium" | "Low";
  status: ApprovalStatus;
  rationale: string;
}

export interface Vendor {
  id: string;
  productionId: string;
  name: string;
  category: string;
  contact: string;
  risk: "Low" | "Medium" | "High";
}

export interface CrewMember {
  id: string;
  productionId: string;
  name: string;
  role: string;
  departmentId: string;
  duePaise: number;
  paidPaise: number;
  nextPaymentDate: string;
}

export interface Payment {
  id: string;
  productionId: string;
  crewId: string;
  amountPaise: number;
  date: string;
}

export interface FinanceState {
  selectedProductionId: string;
  productions: Production[];
  departments: DepartmentBudget[];
  expenses: Expense[];
  approvals: Approval[];
  vendors: Vendor[];
  crew: CrewMember[];
  payments: Payment[];
  activity: { id: string; message: string; at: string; productionId: string }[];
  budgetRevisionDeltaPaise: Record<string, number>;
  revision: number;
  notice?: { message: string; kind: "success" | "error" };
}

export type FinanceAction =
  | { type: "notice/show"; kind: "success" | "error"; message: string }
  | { type: "notice/clear" }
  | { type: "state/restore"; state: FinanceState }
  | { type: "production/select"; productionId: string }
  | { type: "production/update"; productionId: string; changes: Pick<Production, "name" | "type" | "industry" | "status"> }
  | { type: "production/create"; production: Production; department: DepartmentBudget }
  | { type: "expense/create"; expense: Expense }
  | { type: "expense/submit"; expenseId: string }
  | { type: "approval/decide"; approvalId: string; decision: "Approved" | "Rejected" }
  | { type: "approval/pay"; approvalId: string }
  | { type: "expense/pay"; expenseId: string }
  | { type: "budget/revise"; departmentId: string; revisedPaise: number }
  | { type: "crew/pay"; crewId: string; amountPaise: number; date: string };
