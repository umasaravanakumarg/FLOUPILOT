"use client";

import { useState } from "react";
import { BriefcaseBusiness, Check, Mail, Plus, Wallet } from "lucide-react";
import { getAvailableCrewPayment, getProductionSnapshot } from "@/lib/finance";
import { makeDemoProductionId } from "@/lib/finance-state";
import type { FinanceAction, FinanceState, Production, ProductionStatus } from "@/lib/types";
import { Button, Card, EmptyState, fieldClass, formatCr, formatMoney, Modal, SectionTitle, StatusPill, TableFrame } from "./ui";

export function ProductionsModule({
  state,
  dispatch,
}: {
  state: FinanceState;
  dispatch: (action: FinanceAction) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Feature Film");
  const [industry, setIndustry] = useState("South Indian Film");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const selected = state.productions.find((item) => item.id === state.selectedProductionId)!;
  const selectedSummary = getProductionSnapshot(state, selected);
  const createProduction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rupees = Number(budget);
    if (!name.trim() || !industry.trim() || !Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(rupees * 100)) {
      setError("Enter a name, industry and positive budget with up to two decimal places.");
      return;
    }
    const productionId = makeDemoProductionId(name, state.productions.map((production) => production.id));
    const budgetPaise = Math.round(rupees * 100);
    dispatch({
      type: "production/create",
      production: {
        id: productionId,
        name: name.trim(),
        type,
        industry: industry.trim(),
        status: "On Track",
        originalBudgetPaise: budgetPaise,
        revisedBudgetPaise: budgetPaise,
        baselineActualPaise: 0,
        baselineCommittedPaise: 0,
        baselineForecastPaise: 0,
        burnRatePaise: 0,
        baselinePendingApprovals: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      department: {
        id: `${productionId}-general`,
        productionId,
        name: "General",
        originalPaise: budgetPaise,
        revisedPaise: budgetPaise,
        baselineActualPaise: 0,
        baselineCommittedPaise: 0,
        baselineForecastPaise: 0,
      },
    });
    setCreating(false);
    setName("");
    setBudget("");
    setError("");
  };
  return <div className="space-y-6">
    <SectionTitle eyebrow="Production portfolio" title="Productions" description="Choose a project to switch the workspace context. Records and workflow changes stay attached to their production." actions={<Button variant="primary" onClick={() => setCreating((value) => !value)}><Plus size={15} /> New production</Button>} />
    {creating && <Card>
      <h2 className="mb-4 font-semibold text-white">Create production</h2>
      <form onSubmit={createProduction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-300">Production name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Project Orion" className={`${fieldClass} mt-2`} required /></label>
        <label className="text-sm text-slate-300">Format<select value={type} onChange={(event) => setType(event.target.value)} className={`${fieldClass} mt-2`}><option>Feature Film</option><option>Television Series</option><option>Web Series</option><option>Documentary</option></select></label>
        <label className="text-sm text-slate-300">Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} className={`${fieldClass} mt-2`} required /></label>
        <label className="text-sm text-slate-300">Original budget (₹)<input type="number" min="0.01" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} className={`${fieldClass} mt-2`} required /></label>
        {error && <p role="alert" className="text-sm text-rose-300 md:col-span-2 xl:col-span-4">{error}</p>}
        <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-4"><Button type="button" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" variant="primary">Create and open</Button></div>
      </form>
    </Card>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {state.productions.map((production) => {
        const summary = getProductionSnapshot(state, production);
        const active = production.id === state.selectedProductionId;
        return <button key={production.id} type="button" onClick={() => dispatch({ type: "production/select", productionId: production.id })} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${active ? "border-amber-300/40 bg-amber-300/[0.045]" : "border-white/[0.09] bg-[#101922] hover:border-white/20"}`}>
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><div className="rounded-xl bg-white/[0.05] p-2.5 text-amber-200"><BriefcaseBusiness size={17} /></div><div className="min-w-0"><h2 className="truncate font-semibold text-white">{production.name}</h2><p className="mt-1 text-xs text-slate-400">{production.type} · {production.industry}</p></div></div><StatusPill label={summary.health} tone={summary.health === "At Risk" ? "risk" : summary.health === "Watch" ? "watch" : "good"} /></div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4">
            <PortfolioMetric label="Original budget" value={formatCr(summary.originalBudgetPaise)} />
            <PortfolioMetric label="Actual spend" value={formatCr(summary.actualPaise)} />
            <PortfolioMetric label="Forecast" value={formatCr(summary.forecastPaise)} />
            <PortfolioMetric label="Approvals pending" value={String(summary.pendingApprovals)} />
          </div>
        </button>;
      })}
    </div>
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">Selected production</p><h2 className="mt-2 text-xl font-semibold text-white">{selected.name}</h2><p className="mt-1 text-sm text-slate-400">{selected.type} · {selected.industry}</p></div><div className="flex items-center gap-2"><StatusPill label={selectedSummary.health} tone={selectedSummary.health === "At Risk" ? "risk" : selectedSummary.health === "Watch" ? "watch" : "good"} /><Button onClick={() => setEditing(true)}>Edit details</Button></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><PortfolioMetric label="Original budget" value={formatMoney(selected.originalBudgetPaise)} /><PortfolioMetric label="Revised budget" value={formatMoney(selected.revisedBudgetPaise)} /><PortfolioMetric label="Actual spend" value={formatMoney(selectedSummary.actualPaise)} /><PortfolioMetric label="Daily burn" value={`${formatMoney(selected.burnRatePaise)}/day`} /></div>
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4 text-sm"><span className="text-slate-400">Operational status</span><StatusPill label={selected.status} tone={selected.status === "At Risk" ? "risk" : selected.status === "Watch" ? "watch" : "good"} /></div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => dispatch({ type: "production/select", productionId: selected.id })}><Check size={15} /> Set active production</Button><span className="self-center text-xs text-slate-500">Selecting a production updates every module and filters by project ID.</span></div>
    </Card>
    {editing && <ProductionEditDialog production={selected} allProductions={state.productions} onClose={() => setEditing(false)} onSave={(changes) => { dispatch({ type: "production/update", productionId: selected.id, changes }); setEditing(false); }} />}
  </div>;
}

function ProductionEditDialog({ production, allProductions, onClose, onSave }: { production: Production; allProductions: Production[]; onClose: () => void; onSave: (changes: Pick<Production, "name" | "type" | "industry" | "status">) => void }) {
  const [name, setName] = useState(production.name);
  const [type, setType] = useState(production.type);
  const [industry, setIndustry] = useState(production.industry);
  const [status, setStatus] = useState<ProductionStatus>(production.status);
  const [error, setError] = useState("");
  return <Modal title="Edit production details" onClose={onClose}><form onSubmit={(event) => {
    event.preventDefault();
    if (!name.trim() || !industry.trim()) {
      setError("Name and industry are required.");
      return;
    }
    if (allProductions.some((item) => item.id !== production.id && item.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("A production with this name already exists.");
      return;
    }
    onSave({ name: name.trim(), type, industry: industry.trim(), status });
  }} className="space-y-4">
    <label className="block text-sm text-slate-300">Name<input value={name} onChange={(event) => setName(event.target.value)} className={`${fieldClass} mt-2`} /></label>
    <label className="block text-sm text-slate-300">Format<select value={type} onChange={(event) => setType(event.target.value)} className={`${fieldClass} mt-2`}><option>Feature Film</option><option>Television Series</option><option>Web Series</option><option>Documentary</option></select></label>
    <label className="block text-sm text-slate-300">Industry<input value={industry} onChange={(event) => setIndustry(event.target.value)} className={`${fieldClass} mt-2`} /></label>
    <label className="block text-sm text-slate-300">Production status<select value={status} onChange={(event) => setStatus(event.target.value as ProductionStatus)} className={`${fieldClass} mt-2`}><option>On Track</option><option>Watch</option><option>At Risk</option></select></label>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Save details</Button></div>
  </form></Modal>;
}

export function VendorsModule({ state, search }: { state: FinanceState; search: string }) {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const vendors = state.vendors.filter((vendor) => vendor.productionId === state.selectedProductionId && `${vendor.name} ${vendor.category} ${vendor.risk}`.toLowerCase().includes(search.toLowerCase()));
  const selected = vendors.find((vendor) => vendor.id === vendorId);
  return <div className="space-y-6">
    <SectionTitle eyebrow="Supplier network" title="Vendors" description="Review supplier categories, exposure flags and contact information for the selected production." />
    <div className="grid gap-3 sm:grid-cols-3"><OperationsMetric label="Active suppliers" value={String(vendors.length)} /><OperationsMetric label="High exposure" value={String(vendors.filter((vendor) => vendor.risk === "High").length)} /><OperationsMetric label="Scope" value={state.productions.find((item) => item.id === state.selectedProductionId)?.name ?? "—"} /></div>
    {vendors.length ? <div className="grid gap-3 xl:grid-cols-2">{vendors.map((vendor) => <Card key={vendor.id}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{vendor.name}</h2><p className="mt-1 text-xs text-slate-400">{vendor.category}</p></div><StatusPill label={`${vendor.risk} exposure`} tone={vendor.risk === "High" ? "risk" : vendor.risk === "Medium" ? "watch" : "good"} /></div>
      <p className="mt-4 text-sm text-slate-400">Contract and spend totals are not modeled in this demonstration. Supplier risk is a qualitative fixture, not a credit score.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setVendorId(vendor.id)}>Vendor details</Button><a href={`mailto:${vendor.contact}?subject=${encodeURIComponent(`FLOU Pilot · ${vendor.name}`)}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 py-2 text-sm text-slate-200 hover:bg-white/[0.07]"><Mail size={15} /> Contact</a></div>
    </Card>)}</div> : <Card><EmptyState title="No vendors found" description="No vendor records match the search for this production." /></Card>}
    {selected && <Modal title={selected.name} onClose={() => setVendorId(null)}><div className="space-y-4"><Detail label="Category" value={selected.category} /><Detail label="Exposure" value={selected.risk} /><Detail label="Contact" value={selected.contact} /><p className="rounded-xl bg-black/20 p-3 text-sm leading-6 text-slate-400">Contract values and vendor payment terms are not part of this demo dataset. This detail view only exposes available fixture information.</p><a href={`mailto:${selected.contact}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950"><Mail size={15} /> Email vendor</a></div></Modal>}
  </div>;
}

export function CrewModule({ state, dispatch, search }: { state: FinanceState; dispatch: (action: FinanceAction) => void; search: string }) {
  const [payingCrewId, setPayingCrewId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const crew = state.crew.filter((member) => member.productionId === state.selectedProductionId && `${member.name} ${member.role}`.toLowerCase().includes(search.toLowerCase()));
  const openMember = crew.find((member) => member.id === payingCrewId);
  const dueTotal = crew.reduce((sum, member) => sum + member.duePaise - member.paidPaise, 0);
  const paidTotal = crew.reduce((sum, member) => sum + member.paidPaise, 0);
  const confirmPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rupees = Number(paymentAmount);
    if (!openMember || !Number.isFinite(rupees) || rupees <= 0 || !Number.isSafeInteger(rupees * 100)) {
      setPaymentError("Enter a positive payment with up to two decimal places.");
      return;
    }
    const amountPaise = Math.round(rupees * 100);
    if (amountPaise > getAvailableCrewPayment(state, openMember.id)) {
      setPaymentError("Payment exceeds this crew member's outstanding amount.");
      return;
    }
    dispatch({ type: "crew/pay", crewId: openMember.id, amountPaise, date: new Date().toISOString().slice(0, 10) });
    setPayingCrewId(null);
    setPaymentAmount("");
    setPaymentError("");
  };
  return <div className="space-y-6">
    <SectionTitle eyebrow="Payroll obligations" title="Crew & Payments" description="Crew records and payment history are scoped to the active production. Payments are validated against the outstanding amount." />
    <div className="grid gap-3 sm:grid-cols-3"><OperationsMetric label="Crew members" value={String(crew.length)} /><OperationsMetric label="Recorded paid" value={formatMoney(paidTotal)} /><OperationsMetric label="Outstanding" value={formatMoney(dueTotal)} /></div>
    <Card>{crew.length ? <TableFrame>
      <thead className="bg-white/[0.025] text-xs text-slate-400"><tr>{["Crew member", "Role", "Due", "Paid", "Outstanding", "Next payment", "Action"].map((label) => <th key={label} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-white/[0.06]">{crew.map((member) => {
        const outstanding = member.duePaise - member.paidPaise;
        return <tr key={member.id}><th scope="row" className="whitespace-nowrap px-4 py-4 font-medium text-white">{member.name}</th><td className="whitespace-nowrap px-4 py-4 text-slate-300">{member.role}</td><td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(member.duePaise)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-300">{formatMoney(member.paidPaise)}</td><td className="whitespace-nowrap px-4 py-4 font-medium text-slate-100">{formatMoney(outstanding)}</td><td className="whitespace-nowrap px-4 py-4 text-slate-400">{member.nextPaymentDate}</td><td className="px-4 py-4"><Button disabled={outstanding <= 0} onClick={() => { setPayingCrewId(member.id); setPaymentAmount((outstanding / 100).toString()); }} className="min-h-8 px-2.5 py-1 text-xs"><Wallet size={13} /> Record payment</Button></td></tr>;
      })}</tbody>
    </TableFrame> : <EmptyState title="No crew records found" description="No crew members match your search in this production." />}</Card>
    {!!state.payments.filter((payment) => payment.productionId === state.selectedProductionId).length && <Card><h2 className="mb-3 font-semibold text-white">Recent payments</h2><div className="divide-y divide-white/[0.06]">{state.payments.filter((payment) => payment.productionId === state.selectedProductionId).slice().reverse().map((payment) => <div key={payment.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="text-slate-200">{state.crew.find((member) => member.id === payment.crewId)?.name ?? "Crew member"}</span><span className="text-slate-400">{payment.date}</span><span className="font-medium text-emerald-300">{formatMoney(payment.amountPaise)}</span></div>)}</div></Card>}
    {openMember && <Modal title={`Record payment · ${openMember.name}`} onClose={() => { setPayingCrewId(null); setPaymentError(""); }}><form onSubmit={confirmPayment} className="space-y-4"><p className="text-sm text-slate-400">Outstanding: <strong className="text-white">{formatMoney(getAvailableCrewPayment(state, openMember.id))}</strong></p><label className="block text-sm text-slate-300">Payment amount (₹)<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className={`${fieldClass} mt-2`} /></label>{paymentError && <p role="alert" className="text-sm text-rose-300">{paymentError}</p>}<div className="flex justify-end gap-2"><Button type="button" onClick={() => setPayingCrewId(null)}>Cancel</Button><Button type="submit" variant="success">Confirm payment</Button></div></form></Modal>}
  </div>;
}

function PortfolioMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.17em] text-slate-500">{label}</div><div className="mt-1 truncate text-sm font-medium text-slate-100">{value}</div></div>;
}

function OperationsMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[0.08] bg-[#101922] p-4"><div className="text-xs text-slate-400">{label}</div><div className="mt-2 text-lg font-semibold text-white">{value}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-slate-400">{label}</span><span className="text-right text-slate-100">{value}</span></div>;
}
