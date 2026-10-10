"use client";

import { useState } from "react";
import { ArrowRight, Download, FilePlus2, Filter, Send, Wallet } from "lucide-react";
import { getDepartmentSnapshot, getPendingApprovals, getProductionSnapshot } from "@/lib/finance";
import type { Expense, FinanceAction, FinanceState, ModuleId } from "@/lib/types";
import { Button, Card, EmptyState, fieldClass, formatMoney, Modal, SectionTitle, StatusPill, TableFrame } from "./ui";

export function BudgetModule({
  state,
  search,
  focusedDepartmentId,
  dispatch,
  onClearFocus,
}: {
  state: FinanceState;
  search: string;
  focusedDepartmentId: string | null;
  dispatch: (action: FinanceAction) => void;
  onClearFocus: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const production = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const productionSummary = getProductionSnapshot(state, production);
  const activeFocusedDepartmentId = state.departments.some(
    (department) => department.id === focusedDepartmentId && department.productionId === production.id,
  ) ? focusedDepartmentId : null;
  const rows = state.departments.filter((department) => {
    const matchesProduction = department.productionId === state.selectedProductionId;
    const matchesFocus = !activeFocusedDepartmentId || activeFocusedDepartmentId === department.id;
    const matchesSearch = `${department.name} ${department.id}`.toLowerCase().includes(search.toLowerCase());
    return matchesProduction && matchesFocus && matchesSearch;
  });

  const downloadBudget = () => {
    const header = ["Department", "Original budget INR", "Revised budget INR", "Actual INR", "Committed INR", "Forecast INR", "Variance INR"];
    const lines = rows.map((row) => {
      const snapshot = getDepartmentSnapshot(state, row);
      return [row.name, row.originalPaise / 100, snapshot.revisedPaise / 100, snapshot.actualPaise / 100, snapshot.committedPaise / 100, snapshot.forecastPaise / 100, snapshot.variancePaise / 100]
        .map((value) => typeof value === "number" ? value.toString() : `"${value.replaceAll('"', '""')}"`)
        .join(",");
    });
    downloadCsv(`${production.id}-budget.csv`, [header.join(","), ...lines].join("\n"));
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Budget management"
        title="Department financial plan"
        description="Original allocation, current revision, actuals, open obligations and forecast are kept distinct. Commitment does not double-count in forecast."
        actions={<Button onClick={downloadBudget}><Download size={15} /> Export CSV</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryTile label="Original budget" value={formatMoney(productionSummary.originalBudgetPaise)} /><SummaryTile label="Revised budget" value={formatMoney(productionSummary.revisedBudgetPaise)} /><SummaryTile label="Actual spend" value={formatMoney(productionSummary.actualPaise)} /><SummaryTile label="Forecast" value={formatMoney(productionSummary.forecastPaise)} /></div>
      {activeFocusedDepartmentId && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3 text-sm text-amber-100">
        <span>Focused department: {state.departments.find((department) => department.id === activeFocusedDepartmentId)?.name ?? "Selected department"}</span>
        <Button onClick={onClearFocus} className="min-h-8 px-2.5 py-1 text-xs">Show all departments</Button>
      </div>}
      <Card>
        {rows.length ? <TableFrame>
          <thead className="bg-white/[0.025] text-xs text-slate-400">
            <tr>{["Department", "Original", "Revised", "Actual", "Committed", "Forecast", "Variance", "Status", ""].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((row) => {
              const snapshot = getDepartmentSnapshot(state, row);
              const over = snapshot.variancePaise > 0;
              return <tr key={row.id} className={activeFocusedDepartmentId === row.id ? "bg-amber-400/[0.035]" : ""}>
                <th scope="row" className="whitespace-nowrap px-4 py-4 font-medium text-white">{row.name}</th>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(row.originalPaise)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(snapshot.revisedPaise)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(snapshot.actualPaise)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(snapshot.committedPaise)}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-100">{formatMoney(snapshot.forecastPaise)}</td>
                <td className={`whitespace-nowrap px-4 py-4 font-medium ${over ? "text-rose-300" : "text-emerald-300"}`}>{over ? "+" : "−"}{formatMoney(Math.abs(snapshot.variancePaise))}</td>
                <td className="whitespace-nowrap px-4 py-4"><StatusPill label={over ? "Over forecast" : snapshot.forecastPaise > snapshot.revisedPaise ? "Watch" : "On plan"} tone={over ? "risk" : snapshot.forecastPaise > snapshot.revisedPaise ? "watch" : "good"} /></td>
                <td className="whitespace-nowrap px-4 py-4"><Button onClick={() => setEditingId(row.id)} className="min-h-8 px-2.5 py-1 text-xs">Revise</Button></td>
              </tr>;
            })}
          </tbody>
        </TableFrame> : <EmptyState title="No department budgets match" description="Try another search or clear the focused department." />}
        <p className="mt-4 text-xs leading-5 text-slate-500">Art &amp; Sets is an illustrative forecast assumption: ₹16 L above its original allocation. Department-level examples do not reconcile to production-level summary figures.</p>
      </Card>
      {editingId && state.departments.find((department) => department.id === editingId && department.productionId === production.id) && <ReviseBudgetDialog
        department={state.departments.find((department) => department.id === editingId && department.productionId === production.id)!}
        onClose={() => { setEditingId(null); onClearFocus(); }}
        onSave={(revisedPaise) => {
          dispatch({ type: "budget/revise", departmentId: editingId, revisedPaise });
          setEditingId(null);
          onClearFocus();
        }}
      />}
    </div>
  );
}

function ReviseBudgetDialog({ department, onClose, onSave }: { department: FinanceState["departments"][number]; onClose: () => void; onSave: (amount: number) => void }) {
  const [amount, setAmount] = useState((department.revisedPaise / 100).toString());
  const [error, setError] = useState("");
  return <Modal title={`Revise ${department.name} budget`} onClose={onClose}>
    <form onSubmit={(event) => {
      event.preventDefault();
      const rupees = Number(amount);
      if (!Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(rupees * 100)) {
        setError("Enter a positive amount with no more than two decimal places.");
        return;
      }
      onSave(Math.round(rupees * 100));
    }} className="space-y-4">
      <label className="block text-sm text-slate-300">Revised budget (₹)<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${fieldClass} mt-2`} /></label>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Save revision</Button></div>
    </form>
  </Modal>;
}

export function ExpensesModule({
  state,
  search,
  dispatch,
  onNavigate,
  focusExpenseId,
  onClearExpenseFocus,
  focusDepartmentId,
  onClearDepartmentFocus,
}: {
  state: FinanceState;
  search: string;
  dispatch: (action: FinanceAction) => void;
  onNavigate: (module: ModuleId) => void;
  focusExpenseId: string | null;
  onClearExpenseFocus: () => void;
  focusDepartmentId: string | null;
  onClearDepartmentFocus: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const production = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const departments = state.departments.filter((item) => item.productionId === production.id);
  const activeDepartmentFilter =
    departments.find((department) => department.id === focusDepartmentId)?.id ??
    departmentFilter;
  const visibleExpenses = state.expenses.filter((expense) =>
    expense.productionId === production.id &&
    (statusFilter === "All" || expense.status === statusFilter) &&
    (activeDepartmentFilter === "All" || expense.departmentId === activeDepartmentFilter) &&
    `${expense.title} ${expense.vendor} ${expense.id} ${expense.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = state.expenses.find((expense) => expense.id === (focusExpenseId ?? selectedId));

  const submitNewExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rupees = Number(amount);
    if (!title.trim() || !vendor.trim() || !departmentId || !Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(rupees * 100)) {
      setError("Complete all fields and enter a positive amount with up to two decimal places.");
      return;
    }
    dispatch({
      type: "expense/create",
      expense: {
        id: `EXP-${crypto.randomUUID().slice(0, 8)}`,
        productionId: production.id,
        title: title.trim(),
        vendor: vendor.trim(),
        departmentId,
        date: new Date().toISOString().slice(0, 10),
        amountPaise: Math.round(rupees * 100),
        status: "Draft",
        description: description.trim(),
        source: "user",
      },
    });
    setTitle("");
    setVendor("");
    setAmount("");
    setDepartmentId("");
    setDescription("");
    setError("");
    setShowForm(false);
  };

  const pendingTotal = state.expenses.filter((expense) => expense.productionId === production.id && (expense.status === "Pending" || expense.status === "Approved")).reduce((sum, expense) => sum + expense.amountPaise, 0);
  return <div className="space-y-6">
    <SectionTitle eyebrow="Expense ledger" title="Expenses" description="Create, submit, track and record payments against production expenses. Demo transactions are illustrative, not reconciled to the summary baseline." actions={<Button variant="primary" onClick={() => setShowForm(true)}><FilePlus2 size={15} /> New expense</Button>} />
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryTile label="Visible records" value={String(visibleExpenses.length)} />
      <SummaryTile label="Open ledger commitments" value={formatMoney(pendingTotal)} />
      <SummaryTile label="Workflow" value="Draft → pending → approved → paid" />
    </div>
    {showForm && <Card>
      <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Create an expense</h2><p className="mt-1 text-xs text-slate-400">Saving creates a draft. Submit it to add a pending approval and commitment.</p></div><Button onClick={() => setShowForm(false)}>Close</Button></div>
      <form onSubmit={submitNewExpense} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">Expense title<input value={title} onChange={(event) => setTitle(event.target.value)} className={`${fieldClass} mt-2`} required /></label>
        <label className="text-sm text-slate-300">Vendor<input value={vendor} onChange={(event) => setVendor(event.target.value)} className={`${fieldClass} mt-2`} required /></label>
        <label className="text-sm text-slate-300">Department<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={`${fieldClass} mt-2`} required><option value="">Choose department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
        <label className="text-sm text-slate-300">Amount (₹)<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className={`${fieldClass} mt-2`} required /></label>
        <label className="text-sm text-slate-300 md:col-span-2">Notes<textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClass} mt-2 min-h-20 resize-y`} /></label>
        {error && <p role="alert" className="text-sm text-rose-300 md:col-span-2">{error}</p>}
        <div className="flex justify-end md:col-span-2"><Button type="submit" variant="primary">Save draft</Button></div>
      </form>
    </Card>}
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${fieldClass} w-auto min-w-36`}><option>All</option>{["Draft", "Pending", "Approved", "Rejected", "Paid"].map((status) => <option key={status}>{status}</option>)}</select>
        <select aria-label="Filter by department" value={activeDepartmentFilter} onChange={(event) => { setDepartmentFilter(event.target.value); onClearDepartmentFocus(); }} className={`${fieldClass} w-auto min-w-44`}><option value="All">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
        <span className="ml-auto text-xs text-slate-500">Global search applies to expense descriptions and vendor names</span>
      </div>
      {departments.some((department) => department.id === focusDepartmentId) && <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-300/15 bg-amber-300/[0.035] px-3 py-2 text-xs text-amber-100"><span>Focused department: {departments.find((item) => item.id === focusDepartmentId)?.name ?? "Selected department"}</span><button type="button" onClick={onClearDepartmentFocus} className="text-amber-200 underline underline-offset-2">Clear</button></div>}
      {visibleExpenses.length ? <TableFrame>
        <thead className="bg-white/[0.025] text-xs text-slate-400"><tr>{["Expense", "Vendor · department", "Date", "Amount", "Status", "Action"].map((item) => <th key={item} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{item}</th>)}</tr></thead>
        <tbody className="divide-y divide-white/[0.06]">
          {visibleExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} department={departments.find((item) => item.id === expense.departmentId)?.name ?? "—"} onOpen={() => setSelectedId(expense.id)} onSubmit={() => dispatch({ type: "expense/submit", expenseId: expense.id })} onPay={() => dispatch({ type: "expense/pay", expenseId: expense.id })} />)}
        </tbody>
      </TableFrame> : <EmptyState title="No expenses found" description="Change your filters or add an expense to this production." />}
    </Card>
    {selected && <Modal title={selected.title} onClose={() => { setSelectedId(null); onClearExpenseFocus(); }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Status</span><StatusPill label={selected.status} tone={selected.status === "Paid" ? "good" : selected.status === "Pending" ? "watch" : selected.status === "Rejected" ? "risk" : "neutral"} /></div>
        <DetailLine label="Vendor" value={selected.vendor} />
        <DetailLine label="Department" value={departments.find((department) => department.id === selected.departmentId)?.name ?? "—"} />
        <DetailLine label="Amount" value={formatMoney(selected.amountPaise)} />
        <DetailLine label="Date" value={selected.date} />
        <p className="rounded-xl bg-black/20 p-3 text-sm leading-6 text-slate-300">{selected.description || "No additional notes."}</p>
        {selected.status === "Draft" && <Button variant="primary" onClick={() => { dispatch({ type: "expense/submit", expenseId: selected.id }); setSelectedId(null); }}><Send size={15} /> Submit for approval</Button>}
        {selected.status === "Approved" && <Button variant="success" onClick={() => { dispatch({ type: "expense/pay", expenseId: selected.id }); setSelectedId(null); }}><Wallet size={15} /> Record payment</Button>}
        {selected.status === "Pending" && <Button onClick={() => { setSelectedId(null); onNavigate("approvals"); }}>Open linked approval <ArrowRight size={15} /></Button>}
      </div>
    </Modal>}
  </div>;
}

export function ApprovalsModule({
  state,
  search,
  dispatch,
  onOpenExpense,
}: {
  state: FinanceState;
  search: string;
  dispatch: (action: FinanceAction) => void;
  onOpenExpense: (expenseId: string) => void;
}) {
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [confirm, setConfirm] = useState<{ id: string; decision: "Approved" | "Rejected" } | null>(null);
  const production = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const queue = getPendingApprovals(state, production.id).filter((approval) =>
    (priorityFilter === "All" || approval.priority === priorityFilter) &&
    `${approval.title} ${approval.owner} ${approval.id}`.toLowerCase().includes(search.toLowerCase()),
  );
  const decided = state.approvals.filter((approval) => approval.productionId === production.id && approval.status !== "Pending").slice().reverse().slice(0, 4);
  const confirmApproval = state.approvals.find((approval) => approval.id === confirm?.id);
  return <div className="space-y-6">
    <SectionTitle eyebrow="Decision queue" title="Approvals" description={`${queue.length} items currently match this view. An approval creates an obligation; actual spend changes only when payment is recorded.`} actions={<select aria-label="Filter approval priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={`${fieldClass} w-auto`}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select>} />
    <div className="grid gap-3 sm:grid-cols-3"><SummaryTile label="Pending" value={String(getPendingApprovals(state, production.id).length)} /><SummaryTile label="High priority" value={String(getPendingApprovals(state, production.id).filter((item) => item.priority === "High").length)} /><SummaryTile label="Recent decisions" value={String(decided.length)} /></div>
    {queue.length ? <div className="grid gap-3 lg:grid-cols-2">
      {queue.map((approval) => {
        const expense = approval.expenseId ? state.expenses.find((item) => item.id === approval.expenseId) : undefined;
        return <Card key={approval.id} className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{approval.id} · {approval.owner}</p><h2 className="mt-2 text-base font-semibold text-white">{approval.title}</h2></div>
            <StatusPill label={`${approval.priority} priority`} tone={approval.priority === "High" ? "risk" : approval.priority === "Medium" ? "watch" : "neutral"} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{approval.rationale}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-4">
            <span className="text-lg font-semibold text-white">{formatMoney(approval.amountPaise)}</span>
            <div className="flex gap-2">
              {expense && <Button onClick={() => onOpenExpense(expense.id)} className="px-2.5 text-xs">Expense detail</Button>}
              <Button variant="danger" onClick={() => setConfirm({ id: approval.id, decision: "Rejected" })}>Reject</Button>
              <Button variant="success" onClick={() => setConfirm({ id: approval.id, decision: "Approved" })}>Approve</Button>
            </div>
          </div>
        </Card>;
      })}
    </div> : <Card><EmptyState title="Nothing waiting for a decision" description="No approvals match this production, search or priority filter." /></Card>}
    {!!decided.length && <Card><h2 className="mb-4 font-semibold text-white">Recent decisions</h2><div className="space-y-2">{decided.map((approval) => <div key={approval.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] py-3"><span className="text-sm text-slate-200">{approval.title}</span><span className="text-xs text-slate-500">{formatMoney(approval.amountPaise)}</span><StatusPill label={approval.status} tone={approval.status === "Approved" || approval.status === "Paid" ? "good" : "risk"} />{approval.status === "Approved" && !approval.expenseId && <Button variant="success" onClick={() => dispatch({ type: "approval/pay", approvalId: approval.id })} className="min-h-8 px-2.5 py-1 text-xs">Record payment</Button>}</div>)}</div></Card>}
    {confirm && confirmApproval && <Modal title={`${confirm.decision} this request?`} onClose={() => setConfirm(null)}>
      <p className="text-sm leading-6 text-slate-300">You are about to {confirm.decision === "Approved" ? "approve" : "reject"} <strong className="text-white">{confirmApproval.title}</strong> for <strong className="text-white">{formatMoney(confirmApproval.amountPaise)}</strong>. This action cannot be repeated.</p>
      <div className="mt-5 flex justify-end gap-2"><Button onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm.decision === "Approved" ? "success" : "danger"} onClick={() => { dispatch({ type: "approval/decide", approvalId: confirm.id, decision: confirm.decision }); setConfirm(null); }}>{confirm.decision} request</Button></div>
    </Modal>}
  </div>;
}

function ExpenseRow({ expense, department, onOpen, onSubmit, onPay }: { expense: Expense; department: string; onOpen: () => void; onSubmit: () => void; onPay: () => void }) {
  return <tr>
    <td className="max-w-[230px] px-4 py-4"><button type="button" onClick={onOpen} className="block truncate font-medium text-white hover:text-amber-200">{expense.title}</button><span className="mt-1 block text-xs text-slate-500">{expense.id}</span></td>
    <td className="px-4 py-4"><span className="block whitespace-nowrap text-slate-200">{expense.vendor}</span><span className="mt-1 block whitespace-nowrap text-xs text-slate-500">{department}</span></td>
    <td className="whitespace-nowrap px-4 py-4 text-slate-400">{expense.date}</td>
    <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-100">{formatMoney(expense.amountPaise)}</td>
    <td className="px-4 py-4"><StatusPill label={expense.status} tone={expense.status === "Paid" ? "good" : expense.status === "Pending" ? "watch" : expense.status === "Rejected" ? "risk" : "neutral"} /></td>
    <td className="px-4 py-4">{expense.status === "Draft" ? <Button onClick={onSubmit} className="min-h-8 px-2.5 py-1 text-xs">Submit</Button> : expense.status === "Approved" ? <Button variant="success" onClick={onPay} className="min-h-8 px-2.5 py-1 text-xs">Pay</Button> : <Button onClick={onOpen} className="min-h-8 px-2.5 py-1 text-xs">Details</Button>}</td>
  </tr>;
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.08] bg-[#101922] p-4"><div className="text-xs text-slate-400">{label}</div><div className="mt-2 break-words text-sm font-semibold text-white sm:text-base">{value}</div></div>;
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-slate-400">{label}</span><span className="text-right text-slate-100">{value}</span></div>;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
