"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock3,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getDepartmentSnapshot,
  getProductionSnapshot,
  isForecastOverOriginalBudget,
} from "@/lib/finance";
import type { FinanceState, ModuleId } from "@/lib/types";
import { Button, Card, EmptyState, formatCr, formatLakhs, formatMoney, SectionTitle, StatusPill } from "./ui";

export function DashboardModule({
  state,
  onNavigate,
  onFocusDepartment,
}: {
  state: FinanceState;
  onNavigate: (module: ModuleId) => void;
  onFocusDepartment: (id: string) => void;
}) {
  const production = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const summary = getProductionSnapshot(state, production);
  const departments = state.departments
    .filter((department) => department.productionId === production.id)
    .map((department) => {
      const snapshot = getDepartmentSnapshot(state, department);
      return {
        id: department.id,
        name: department.name,
        budget: department.originalPaise / 1_000_000_000,
        forecast: snapshot.forecastPaise / 1_000_000_000,
        variance: snapshot.variancePaise,
      };
    });
  const expenses = state.expenses
    .filter((expense) => expense.productionId === production.id)
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
  const trend = state.expenses
    .filter((expense) => expense.productionId === production.id)
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .reduce<{ date: string; spend: number; cumulative: number }[]>((rows, expense) => {
      const cumulative = (rows.at(-1)?.cumulative ?? 0) + expense.amountPaise / 10_000_000;
      rows.push({
        date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${expense.date}T12:00:00`)),
        spend: expense.amountPaise / 10_000_000,
        cumulative,
      });
      return rows;
    }, []);
  const openApprovals = state.approvals
    .filter((approval) => approval.productionId === production.id && approval.status === "Pending")
    .slice(0, 3);
  const kpis = [
    { label: "Original budget", value: formatCr(summary.originalBudgetPaise), detail: "Planning baseline", icon: Wallet, onClick: () => onNavigate("budget"), tone: "neutral" as const },
    { label: "Actual spend", value: formatCr(summary.actualPaise), detail: "Reported actuals + new paid items", icon: CircleDollarSign, onClick: () => onNavigate("expenses"), tone: "neutral" as const },
    { label: "Remaining", value: formatCr(summary.remainingPaise), detail: "Original budget less actual spend", icon: ArrowDownRight, onClick: () => onNavigate("budget"), tone: "good" as const },
    { label: "Forecast final cost", value: formatCr(summary.forecastPaise), detail: `${summary.variancePaise >= 0 ? "Over" : "Under"} by ${formatLakhs(Math.abs(summary.variancePaise))}`, icon: ArrowUpRight, onClick: () => onNavigate("reports"), tone: "risk" as const },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Producer command center"
        title={production.name}
        description={`${production.type} · ${production.industry} · A clear view of what has been spent, committed and forecast.`}
        actions={
          <>
            <StatusPill label={summary.health} tone={summary.health === "At Risk" ? "risk" : summary.health === "Watch" ? "watch" : "good"} />
            <Button onClick={() => onNavigate("productions")}>Production overview <ArrowRight size={15} /></Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, detail, icon: Icon, onClick, tone }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-300/30 ${tone === "risk" ? "border-rose-500/20 bg-rose-500/[0.045]" : tone === "good" ? "border-emerald-500/20 bg-emerald-500/[0.045]" : "border-white/[0.09] bg-[#101922]"}`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{label}</span><Icon size={16} className={tone === "risk" ? "text-rose-300" : tone === "good" ? "text-emerald-300" : "text-amber-200"} />
            </div>
            <div className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{value}</div>
            <p className="mt-2 text-xs text-slate-400">{detail}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="font-semibold text-white">Sample expense activity</h2><p className="mt-1 text-xs text-slate-400">Cumulative sample ledger rows; not a full actual-spend time series.</p></div>
            <Button onClick={() => onNavigate("expenses")}><CircleDollarSign size={15} /> Expense ledger</Button>
          </div>
          {trend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: 2, right: 12, top: 10, bottom: 0 }}>
                  <defs><linearGradient id="ledgerFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#fbbf24" stopOpacity={0.28} /><stop offset="100%" stopColor="#fbbf24" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="rgba(148,163,184,.12)" vertical={false} />
                  <XAxis dataKey="date" stroke="#788899" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="#788899" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `₹${value}L`} />
                  <Tooltip formatter={(value) => typeof value === "number" ? `₹${value.toFixed(1)}L` : value} contentStyle={{ background: "#101922", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative sample rows" stroke="#fbbf24" strokeWidth={2.5} fill="url(#ledgerFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState title="No expense activity" description="Create an expense to build a project ledger." />}
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="font-semibold text-white">Forecast vs original</h2><p className="mt-1 text-xs text-slate-400">Original allocation and current estimate</p></div>
            <StatusPill label={summary.health} tone={summary.health === "At Risk" ? "risk" : summary.health === "Watch" ? "watch" : "good"} />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: "Budget", original: summary.originalBudgetPaise / 100_000_000, forecast: summary.forecastPaise / 100_000_000 }]} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip formatter={(value) => typeof value === "number" ? `₹${value.toFixed(2)} Cr` : value} contentStyle={{ background: "#101922", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, color: "#e2e8f0" }} />
                <Bar dataKey="original" name="Original" fill="#475569" radius={[0, 5, 5, 0]} barSize={18} />
                <Bar dataKey="forecast" name="Forecast" fill={summary.variancePaise > 0 ? "#fb7185" : "#fbbf24"} radius={[0, 5, 5, 0]} barSize={18}>
                  <Cell fill={summary.variancePaise > 0 ? "#fb7185" : "#fbbf24"} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 border-t border-white/[0.07] pt-4 text-sm">
            <Metric label="Committed obligations" value={formatCr(summary.committedPaise)} />
            <Metric label="Daily burn rate" value={`${formatLakhs(production.burnRatePaise)}/day`} />
            <Metric label="Pending approvals" value={String(summary.pendingApprovals)} onClick={() => onNavigate("approvals")} />
            <Metric label="Forecast variance" value={`${summary.variancePaise >= 0 ? "+" : "−"}${formatLakhs(Math.abs(summary.variancePaise))}`} emphasis />
          </div>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs leading-5 text-slate-400">
        <Wallet size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p><strong className="font-medium text-slate-300">Cash-flow outlook is not modeled.</strong> The demo has no verified cash balance or dated funding schedule, so no liquidity forecast is inferred from spend figures.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="font-semibold text-white">Department risk</h2><p className="mt-1 text-xs text-slate-400">Click a department to inspect its budget and expenses</p></div>
            <Button onClick={() => onNavigate("budget")}>Open budget <ArrowRight size={15} /></Button>
          </div>
          <div className="space-y-2">
            {departments.map((department) => (
              <button key={department.id} type="button" onClick={() => onFocusDepartment(department.id)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="min-w-0"><div className="truncate text-sm font-medium text-white">{department.name}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (department.forecast / (department.budget || 1)) * 100)}%` }} /></div></div>
                <span className="text-xs text-slate-300">₹{department.forecast.toFixed(2)} Cr forecast</span>
                <span className={`hidden text-xs sm:block ${department.variance > 0 ? "text-rose-300" : "text-emerald-300"}`}>{department.variance > 0 ? "+" : "−"}{formatLakhs(Math.abs(department.variance))}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="font-semibold text-white">Approval queue</h2><p className="mt-1 text-xs text-slate-400">Priority items requiring a decision</p></div>
            <Button onClick={() => onNavigate("approvals")}>Review all <ArrowRight size={15} /></Button>
          </div>
          {openApprovals.length ? <div className="space-y-2">
            {openApprovals.map((approval) => <button key={approval.id} type="button" onClick={() => onNavigate("approvals")} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-3 text-left hover:border-amber-300/25">
              <div className={`rounded-lg p-2 ${approval.priority === "High" ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"}`}>{approval.priority === "High" ? <ShieldAlert size={16} /> : <Clock3 size={16} />}</div>
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-white">{approval.title}</div><div className="mt-1 text-xs text-slate-400">{approval.owner}</div></div>
              <div className="whitespace-nowrap text-xs text-slate-200">{formatMoney(approval.amountPaise)}</div>
            </button>)}
          </div> : <EmptyState title="Queue clear" description="There are no pending approvals for this production." />}
          <button type="button" onClick={() => onNavigate("ai")} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-3 text-left hover:bg-amber-400/[0.08]">
            <Sparkles className="text-amber-200" size={17} /><span className="flex-1 text-sm text-slate-200">Ask Pilot to explain the current risk</span><ArrowRight className="text-slate-400" size={15} />
          </button>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Recent sample ledger entries</h2><p className="mt-1 text-xs text-slate-400">Fixtures are illustrative and do not reconcile to the headline actual-spend summary.</p></div><Button onClick={() => onNavigate("expenses")}>Open ledger</Button></div>
        {expenses.length ? <div className="divide-y divide-white/[0.06]">
          {expenses.map((expense) => <button key={expense.id} type="button" onClick={() => onNavigate("expenses")} className="flex w-full flex-wrap items-center gap-3 py-3 text-left hover:bg-white/[0.02] sm:flex-nowrap">
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{expense.title}</span><span className="mt-1 block text-xs text-slate-400">{expense.vendor} · {expense.date}</span></span>
            <StatusPill label={expense.status} tone={expense.status === "Paid" ? "good" : expense.status === "Pending" ? "watch" : "neutral"} />
            <span className="w-28 text-right text-sm font-medium text-slate-200">{formatMoney(expense.amountPaise)}</span>
          </button>)}
        </div> : <EmptyState title="No ledger entries" description="New expenses will appear here." />}
      </Card>
      {isForecastOverOriginalBudget(summary.forecastPaise, summary.originalBudgetPaise) && <div className="flex gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/[0.04] p-4 text-sm text-rose-100"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" /><p>Forecast is {formatLakhs(summary.variancePaise)} above the original allocation. Commitments are shown separately and are not added a second time to forecast.</p></div>}
    </div>
  );
}

function Metric({ label, value, onClick, emphasis = false }: { label: string; value: string; onClick?: () => void; emphasis?: boolean }) {
  const content = <><span className="text-slate-400">{label}</span><span className={emphasis ? "font-semibold text-rose-200" : "font-medium text-slate-100"}>{value}</span></>;
  return onClick ? <button type="button" onClick={onClick} className="flex w-full justify-between hover:text-white">{content}</button> : <div className="flex justify-between">{content}</div>;
}
