"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Download, Info, RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { answerDemoQuestion, type AiResponse } from "@/lib/ai-demo";
import { getDepartmentSnapshot, getProductionSnapshot } from "@/lib/finance";
import type { FinanceState, ModuleId } from "@/lib/types";
import { Button, Card, EmptyState, fieldClass, formatCr, formatMoney, SectionTitle, StatusPill, TableFrame } from "./ui";

export function ReportsModule({ state, onNavigate }: { state: FinanceState; onNavigate: (module: ModuleId) => void }) {
  const [report, setReport] = useState<"financial" | "department" | "activity">("financial");
  const production = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const summary = getProductionSnapshot(state, production);
  const departments = state.departments.filter((department) => department.productionId === production.id).map((department) => getDepartmentSnapshot(state, department));
  const activity = state.activity.filter((entry) => entry.productionId === production.id).slice(0, 10);
  const exportReport = () => {
    const rows = report === "department"
      ? [["Department", "Original", "Revised", "Actual", "Committed", "Forecast", "Variance"], ...departments.map((row) => [row.name, row.originalPaise, row.revisedPaise, row.actualPaise, row.committedPaise, row.forecastPaise, row.variancePaise])]
      : [["Metric", "Amount INR"], ["Original budget", summary.originalBudgetPaise / 100], ["Actual spend", summary.actualPaise / 100], ["Committed obligations", summary.committedPaise / 100], ["Remaining budget", summary.remainingPaise / 100], ["Forecast final cost", summary.forecastPaise / 100], ["Forecast variance", summary.variancePaise / 100], ["Pending approvals", summary.pendingApprovals]];
    downloadCsv(`${production.id}-${report}-report.csv`, rows.map((row) => row.map(csvCell).join(",")).join("\n"));
  };
  return <div className="space-y-6">
    <SectionTitle eyebrow="Producer reporting" title="Reports" description="Live financial summaries are based on the selected production's stated baseline plus user-entered changes. Ledger samples are explicitly excluded from baseline reconciliation." actions={<Button onClick={exportReport}><Download size={15} /> Export current report</Button>} />
    <div className="flex flex-wrap gap-2">{(["financial", "department", "activity"] as const).map((key) => <button key={key} type="button" onClick={() => setReport(key)} className={`rounded-full px-3.5 py-2 text-xs transition ${report === key ? "bg-amber-300 text-slate-950" : "border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"}`}>{key === "financial" ? "Financial summary" : key === "department" ? "Department variance" : "Activity history"}</button>)}</div>
    {report === "financial" && <Card><div className="mb-4"><h2 className="font-semibold text-white">Financial snapshot · {production.name}</h2><p className="mt-1 text-xs text-slate-400">Current figures in Indian Rupees</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><ReportMetric label="Original budget" value={formatCr(summary.originalBudgetPaise)} /><ReportMetric label="Revised budget" value={formatCr(summary.revisedBudgetPaise)} /><ReportMetric label="Actual spend" value={formatCr(summary.actualPaise)} /><ReportMetric label="Committed obligations" value={formatCr(summary.committedPaise)} /><ReportMetric label="Remaining against original" value={formatCr(summary.remainingPaise)} /><ReportMetric label="Forecast final cost" value={formatCr(summary.forecastPaise)} /><ReportMetric label="Forecast variance" value={`${summary.variancePaise >= 0 ? "+" : "−"}${formatMoney(Math.abs(summary.variancePaise))}`} /><ReportMetric label="Pending approvals" value={String(summary.pendingApprovals)} /><ReportMetric label="Budget health" value={summary.health} /></div><p className="mt-5 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] p-3 text-xs leading-5 text-slate-400">Demo financial headline values are supplied summary assumptions. Seed transaction fixtures are examples, not a complete ledger, and are not added to the summary actual-spend baseline.</p></Card>}
    {report === "department" && <Card><div className="mb-4"><h2 className="font-semibold text-white">Department forecast and variance</h2><p className="mt-1 text-xs text-slate-400">Forecast variance = forecast less original department allocation</p></div>{departments.length ? <TableFrame><thead className="bg-white/[0.025] text-xs text-slate-400"><tr>{["Department", "Original", "Actual", "Committed", "Forecast", "Variance"].map((label) => <th scope="col" key={label} className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-white/[0.06]">{departments.map((row) => <tr key={row.id}><th scope="row" className="whitespace-nowrap px-4 py-4 font-medium text-white">{row.name}</th><td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(row.originalPaise)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(row.actualPaise)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(row.committedPaise)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-100">{formatMoney(row.forecastPaise)}</td><td className={`whitespace-nowrap px-4 py-4 ${row.variancePaise > 0 ? "text-rose-300" : "text-emerald-300"}`}>{row.variancePaise > 0 ? "+" : "−"}{formatMoney(Math.abs(row.variancePaise))}</td></tr>)}</tbody></TableFrame> : <EmptyState title="No department rows" description="Create a department budget to report against it." />}</Card>}
    {report === "activity" && <Card><div className="mb-4"><h2 className="font-semibold text-white">Recent production activity</h2><p className="mt-1 text-xs text-slate-400">Workflow events for {production.name}</p></div>{activity.length ? <div className="space-y-1">{activity.map((entry) => <div key={entry.id} className="flex items-start gap-3 rounded-lg px-2 py-3"><span className="mt-0.5 rounded-full bg-amber-300/10 p-2 text-amber-200"><Activity size={15} /></span><span className="flex-1 text-sm text-slate-200">{entry.message}</span><span className="whitespace-nowrap text-xs text-slate-500">{entry.at}</span></div>)}</div> : <EmptyState title="No activity yet" description="Actions taken on this production will appear here." />}</Card>}
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium text-white">Explore the underlying records</h2><p className="mt-1 text-xs text-slate-400">Move from the summary to its source workflow.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => onNavigate("budget")}>Budget</Button><Button onClick={() => onNavigate("expenses")}>Expenses</Button><Button onClick={() => onNavigate("approvals")}>Approvals <ArrowRight size={14} /></Button></div></Card>
  </div>;
}

export function AiModule({ state, onNavigate, onFocusExpenses }: { state: FinanceState; onNavigate: (module: ModuleId) => void; onFocusExpenses: (departmentId: string | null) => void }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AiResponse>(() => answerDemoQuestion("Why is the Art department over budget?", state));
  const ask = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setQuestion(clean);
    setResponse(answerDemoQuestion(clean, state));
    setQuestion("");
  };
  const prompts = ["Why is Art over budget?", "Which approvals are still pending?", "Summarize the current financial outlook", "What does the expense ledger include?"];
  return <div className="space-y-6">
    <SectionTitle eyebrow="Explainable intelligence" title="AI Pilot" description="This offline demonstration uses deterministic rules over the current demo and user-entered data. No external AI provider, OCR, or hidden dataset is connected." actions={<StatusPill label="Offline demo" tone="watch" />} />
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <div className="flex items-center gap-2"><Sparkles size={17} className="text-amber-200" /><h2 className="font-semibold text-white">Ask about this production</h2></div>
        <p className="mt-2 text-sm leading-6 text-slate-400">Responses cite only the production summary, budgets, approvals and sample expenses currently available.</p>
        <form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask(question); }}><input aria-label="Ask Pilot a question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask why a budget is at risk…" className={fieldClass} /><Button type="submit" variant="primary" aria-label="Send question"><Send size={15} /></Button></form>
        <div className="mt-5 space-y-2"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Suggested questions</p>{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => ask(prompt)} className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] px-3 py-2.5 text-left text-xs text-slate-300 hover:border-amber-300/25 hover:text-white"><span>{prompt}</span><ArrowRight size={13} /></button>)}</div>
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.22em] text-amber-200">Deterministic analysis</p><h2 className="mt-2 text-xl font-semibold text-white">{response.title}</h2></div><Sparkles size={19} className="shrink-0 text-amber-200" /></div>
        <p className="mt-4 text-sm leading-7 text-slate-300">{response.answer}</p>
        {response.evidence.length > 0 && <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/15 p-4"><h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-200"><ShieldCheck size={14} className="text-emerald-300" /> Evidence from current records</h3><ul className="space-y-2">{response.evidence.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="text-amber-200">·</span>{item}</li>)}</ul></div>}
        <div className="mt-5 flex flex-wrap gap-2">{response.actions.map((action) => <Button key={`${action.module}-${action.label}`} onClick={() => {
          if (action.module === "expenses" && /art/i.test(action.label)) {
            const art = state.departments.find((department) => department.productionId === state.selectedProductionId && department.name.toLowerCase().includes("art"));
            onFocusExpenses(art?.id ?? null);
          }
          onNavigate(action.module);
        }}>{action.label} <ArrowRight size={14} /></Button>)}</div>
        <p className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-500"><Info size={14} className="mt-0.5 shrink-0" />{response.disclaimer}</p>
      </Card>
    </div>
    <Card><h2 className="mb-3 font-semibold text-white">How this explanation is calculated</h2><div className="grid gap-3 sm:grid-cols-3"><MethodStep number="01" title="Read the baseline" detail="Headline actuals, budget and forecast are explicit demo summary inputs." /><MethodStep number="02" title="Apply tracked changes" detail="Paid entries, open commitments and pending approvals are calculated from current application state." /><MethodStep number="03" title="Show the assumption" detail="Department forecasts and sample ledger rows remain labeled illustrative when they do not reconcile." /></div></Card>
  </div>;
}

export function SettingsModule() {
  const [threshold, setThreshold] = useState("350000");
  const [buffer, setBuffer] = useState("12");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const value = localStorage.getItem("flou-pilot-settings");
        if (value) {
          const parsed = JSON.parse(value) as { threshold?: string; buffer?: string; notifications?: boolean };
          if (parsed.threshold) setThreshold(parsed.threshold);
          if (parsed.buffer) setBuffer(parsed.buffer);
          if (typeof parsed.notifications === "boolean") {
            setNotifications(parsed.notifications);
            window.dispatchEvent(new CustomEvent("flou:notifications", { detail: parsed.notifications }));
          }
        }
      } catch {
        setError("Saved preferences could not be read. Defaults remain available.");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const thresholdNumber = Number(threshold);
    const bufferNumber = Number(buffer);
    if (!Number.isFinite(thresholdNumber) || thresholdNumber <= 0 || !Number.isFinite(bufferNumber) || bufferNumber < 0 || bufferNumber > 100) {
      setError("Enter a positive alert threshold and a cash buffer between 0 and 100 percent.");
      return;
    }
    try {
      localStorage.setItem("flou-pilot-settings", JSON.stringify({ threshold, buffer, notifications }));
      window.dispatchEvent(new CustomEvent("flou:notifications", { detail: notifications }));
      setSaved(true);
      setError("");
    } catch {
      setError("Preferences could not be saved in this browser.");
    }
  };
  const reset = () => {
    try {
      localStorage.removeItem("flou-pilot-settings");
      window.dispatchEvent(new CustomEvent("flou:notifications", { detail: true }));
      setThreshold("350000");
      setBuffer("12");
      setNotifications(true);
      setSaved(false);
      setError("");
    } catch {
      setError("Preferences could not be reset in this browser.");
    }
  };
  return <div className="space-y-6">
    <SectionTitle eyebrow="Workspace preferences" title="Settings" description="Preferences are saved in this browser for the demonstration. Authentication, role-based access control and server-side persistence are not connected." />
    <form onSubmit={save} className="grid gap-4 xl:grid-cols-2">
      <Card><h2 className="font-semibold text-white">Finance guardrails</h2><p className="mt-1 text-xs leading-5 text-slate-400">These preferences are descriptive and do not change the approval rules in the demo.</p>
        <div className="mt-5 space-y-4"><label className="block text-sm text-slate-300">Approval alert threshold (₹)<input type="number" min="1" step="1" value={threshold} onChange={(event) => { setThreshold(event.target.value); setSaved(false); }} className={`${fieldClass} mt-2`} /></label><label className="block text-sm text-slate-300">Cash buffer target (%)<input type="number" min="0" max="100" step="1" value={buffer} onChange={(event) => { setBuffer(event.target.value); setSaved(false); }} className={`${fieldClass} mt-2`} /></label></div>
      </Card>
      <Card><h2 className="font-semibold text-white">Workspace preferences</h2><p className="mt-1 text-xs leading-5 text-slate-400">Control local notification cues and reset locally stored preference values.</p>
        <button type="button" role="switch" aria-checked={notifications} onClick={() => { setNotifications((value) => !value); setSaved(false); }} className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/[0.08] p-3 text-left"><span><span className="block text-sm text-white">Approval notification indicator</span><span className="mt-1 block text-xs text-slate-400">Show the pending-approval cue in the header</span></span><span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition ${notifications ? "bg-amber-400" : "bg-slate-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-slate-950 transition ${notifications ? "left-6" : "left-1"}`} /></span></button>
        <div className="mt-4 rounded-xl border border-white/[0.07] p-3 text-xs leading-5 text-slate-400">Data mode: browser-local demo state. A refresh restores this browser&apos;s saved workflow state.</div>
      </Card>
      {error && <p role="alert" className="text-sm text-rose-300 xl:col-span-2">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 xl:col-span-2"><Button type="submit" variant="primary"><ShieldCheck size={15} /> Save preferences</Button><Button type="button" onClick={reset}><RotateCcw size={14} /> Reset preferences</Button>{saved && <span role="status" className="text-sm text-emerald-300">Preferences saved in this browser.</span>}</div>
    </form>
  </div>;
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><div className="text-xs text-slate-400">{label}</div><div className="mt-2 text-lg font-semibold text-white">{value}</div></div>;
}

function MethodStep({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><div className="text-[10px] tracking-[0.2em] text-amber-200">{number}</div><h3 className="mt-2 text-sm font-medium text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p></div>;
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

function csvCell(value: string | number) {
  return typeof value === "number" ? String(value) : `"${value.replaceAll('"', '""')}"`;
}
