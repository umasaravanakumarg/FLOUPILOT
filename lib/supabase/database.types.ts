export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProductionRow = {
  id: string;
  tenant_id: string;
  name: string;
  production_type: string;
  industry: string;
  status: "on_track" | "watch" | "at_risk";
  created_at: string;
};
type DepartmentRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  name: string;
};
type BudgetAllocationRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  department_id: string;
  original_paise: number;
  revised_paise: number;
  updated_at: string;
};
type ExpenseRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  department_id: string;
  vendor_id: string | null;
  vendor_name: string;
  title: string;
  description: string;
  expense_date: string;
  amount_paise: number;
  status: "draft" | "pending" | "approved" | "rejected" | "paid";
  created_by: string;
  created_at: string;
};
type ApprovalRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  expense_id: string | null;
  title: string;
  owner: string;
  amount_paise: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected" | "paid";
  rationale: string;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
};
type VendorRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  name: string;
  category: string;
  contact: string | null;
  risk: "low" | "medium" | "high";
  created_at: string;
};
type CrewRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  department_id: string;
  name: string;
  role: string;
  due_paise: number;
  next_payment_date: string | null;
  created_at: string;
};
type PaymentRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  expense_id: string | null;
  approval_id: string | null;
  crew_id: string | null;
  amount_paise: number;
  paid_at: string;
  recorded_by: string;
  created_at: string;
};
type AuditEventRow = {
  id: string;
  tenant_id: string;
  production_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      tenants: Table<
        { id: string; name: string; created_at: string },
        { id?: string; name: string }
      >;
      tenant_memberships: Table<
        { tenant_id: string; user_id: string; role: "owner" | "admin" | "member"; created_at: string },
        { tenant_id: string; user_id: string; role?: "owner" | "admin" | "member" }
      >;
      production_memberships: Table<
        { tenant_id: string; production_id: string; user_id: string; role: "producer" | "finance" | "approver" | "viewer"; created_at: string },
        { tenant_id: string; production_id: string; user_id: string; role: "producer" | "finance" | "approver" | "viewer" }
      >;
      productions: Table<ProductionRow, Omit<ProductionRow, "id" | "created_at">>;
      departments: Table<DepartmentRow, Omit<DepartmentRow, "id">>;
      budget_allocations: Table<BudgetAllocationRow, Omit<BudgetAllocationRow, "id" | "updated_at">>;
      expenses: Table<ExpenseRow, Omit<ExpenseRow, "id" | "created_at" | "created_by" | "status"> & { status?: ExpenseRow["status"]; created_by?: string }>;
      approvals: Table<ApprovalRow, Omit<ApprovalRow, "id" | "created_at" | "decided_by" | "decided_at">>;
      vendors: Table<VendorRow, Omit<VendorRow, "id" | "created_at">>;
      crew_members: Table<CrewRow, Omit<CrewRow, "id" | "created_at">>;
      payments: Table<PaymentRow, Omit<PaymentRow, "id" | "created_at" | "recorded_by">>;
      audit_events: Table<AuditEventRow, never, never>;
    };
    Views: Record<string, never>;
    Functions: {
      create_production: {
        Args: { p_tenant_id: string; p_name: string; p_type: string; p_industry: string; p_department_name: string; p_budget_paise: number };
        Returns: string;
      };
      update_production: {
        Args: { p_production_id: string; p_name: string; p_type: string; p_industry: string; p_status: ProductionRow["status"] };
        Returns: undefined;
      };
      create_expense: {
        Args: { p_production_id: string; p_department_id: string; p_title: string; p_vendor_name: string; p_expense_date: string; p_amount_paise: number; p_description: string };
        Returns: string;
      };
      submit_expense: { Args: { p_expense_id: string }; Returns: undefined };
      decide_approval: { Args: { p_approval_id: string; p_decision: "approved" | "rejected" }; Returns: undefined };
      record_expense_payment: { Args: { p_expense_id: string }; Returns: undefined };
      record_approval_payment: { Args: { p_approval_id: string }; Returns: undefined };
      revise_budget: { Args: { p_department_id: string; p_revised_paise: number }; Returns: undefined };
      record_crew_payment: { Args: { p_crew_id: string; p_amount_paise: number; p_paid_at: string }; Returns: undefined };
    };
    Enums: {
      tenant_role: "owner" | "admin" | "member";
      production_role: "producer" | "finance" | "approver" | "viewer";
      production_status: "on_track" | "watch" | "at_risk";
      expense_status: "draft" | "pending" | "approved" | "rejected" | "paid";
      approval_status: "pending" | "approved" | "rejected" | "paid";
      approval_priority: "high" | "medium" | "low";
      vendor_risk: "low" | "medium" | "high";
    };
    CompositeTypes: Record<string, never>;
  };
}
