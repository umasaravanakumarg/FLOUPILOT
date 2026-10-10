"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleDollarSign,
  FileBadge2,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { createInitialState, financeReducer } from "@/lib/finance-state";
import type { FinanceState, ModuleId } from "@/lib/types";
import { DashboardModule } from "./dashboard";
import { ApprovalsModule, BudgetModule, ExpensesModule } from "./budget-expenses";
import { AiModule, ReportsModule, SettingsModule } from "./insights";
import { CrewModule, ProductionsModule, VendorsModule } from "./operations";
import { Button } from "./ui";

const navigation: { id: ModuleId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "productions", label: "Productions", icon: BriefcaseBusiness },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "expenses", label: "Expenses", icon: CircleDollarSign },
  { id: "approvals", label: "Approvals", icon: FileBadge2 },
  { id: "vendors", label: "Vendors", icon: ShieldCheck },
  { id: "crew", label: "Crew & Payments", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "ai", label: "AI Pilot", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

type SearchHit = { id: string; title: string; detail: string; module: ModuleId };

export function FlouApp() {
  const [state, dispatch] = useReducer(financeReducer, undefined, createInitialState);
  const [module, setModule] = useState<ModuleId>("dashboard");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [focusedDepartmentId, setFocusedDepartmentId] = useState<string | null>(null);
  const [focusedExpenseDepartmentId, setFocusedExpenseDepartmentId] = useState<string | null>(null);
  const [focusExpenseId, setFocusExpenseId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const persistenceFailureShown = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("flou-pilot-demo-state");
      if (raw) {
        const saved = JSON.parse(raw) as FinanceState;
        if (
          saved &&
          Array.isArray(saved.productions) &&
          saved.productions.some((item) => item.id === saved.selectedProductionId) &&
          Array.isArray(saved.departments) &&
          Array.isArray(saved.expenses) &&
          Array.isArray(saved.approvals) &&
          Array.isArray(saved.vendors) &&
          Array.isArray(saved.crew) &&
          Array.isArray(saved.payments) &&
          Array.isArray(saved.activity)
        ) {
          dispatch({ type: "state/restore", state: saved });
        } else {
          dispatch({ type: "notice/show", kind: "error", message: "Saved demo data is incomplete. The seeded workspace has been loaded instead." });
        }
      }
    } catch {
      dispatch({ type: "notice/show", kind: "error", message: "Saved demo data could not be read. The in-memory demo data is still available." });
    } finally {
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem("flou-pilot-demo-state", JSON.stringify(state));
      persistenceFailureShown.current = false;
    } catch {
      if (!persistenceFailureShown.current) {
        persistenceFailureShown.current = true;
        dispatch({ type: "notice/show", kind: "error", message: "Changes are active for this session but could not be saved in this browser." });
      }
    }
  }, [restored, state]);

  useEffect(() => {
    const updateSetting = (event: Event) => {
      const enabled = (event as CustomEvent<unknown>).detail;
      if (typeof enabled === "boolean") setNotificationsEnabled(enabled);
    };
    window.addEventListener("flou:notifications", updateSetting);
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem("flou-pilot-settings");
        if (raw) {
          const saved = JSON.parse(raw) as { notifications?: unknown };
          if (typeof saved.notifications === "boolean") setNotificationsEnabled(saved.notifications);
        }
      } catch {
        setNotificationsEnabled(true);
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("flou:notifications", updateSetting);
    };
  }, []);

  useEffect(() => {
    if (!state.notice) return;
    const timeout = window.setTimeout(() => dispatch({ type: "notice/clear" }), 3600);
    return () => window.clearTimeout(timeout);
  }, [state.notice]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const searchHits = useMemo<SearchHit[]>(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    const hits: SearchHit[] = [];
    state.productions.forEach((item) => {
      if (`${item.name} ${item.type}`.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.name, detail: "Production", module: "productions" });
    });
    state.departments.filter((item) => item.productionId === state.selectedProductionId).forEach((item) => {
      if (item.name.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.name, detail: "Department budget", module: "budget" });
    });
    state.expenses.filter((item) => item.productionId === state.selectedProductionId).forEach((item) => {
      if (`${item.id} ${item.title} ${item.vendor}`.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.title, detail: `${item.vendor} · expense`, module: "expenses" });
    });
    state.approvals.filter((item) => item.productionId === state.selectedProductionId && item.status === "Pending").forEach((item) => {
      if (`${item.id} ${item.title} ${item.owner}`.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.title, detail: `${item.owner} · approval`, module: "approvals" });
    });
    state.vendors.filter((item) => item.productionId === state.selectedProductionId).forEach((item) => {
      if (`${item.name} ${item.category}`.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.name, detail: "Vendor", module: "vendors" });
    });
    state.crew.filter((item) => item.productionId === state.selectedProductionId).forEach((item) => {
      if (`${item.name} ${item.role}`.toLowerCase().includes(term)) hits.push({ id: item.id, title: item.name, detail: `${item.role} · crew`, module: "crew" });
    });
    return hits.slice(0, 7);
  }, [search, state]);

  const goTo = (target: ModuleId) => {
    setModule(target);
    setMobileNavOpen(false);
  };

  const openSearchHit = (hit: SearchHit) => {
    if (hit.module === "productions") dispatch({ type: "production/select", productionId: hit.id });
    if (hit.module === "budget") setFocusedDepartmentId(hit.id);
    if (hit.module === "expenses") setFocusExpenseId(hit.id);
    setModule(hit.module);
    setSearch("");
  };

  const renderModule = () => {
    switch (module) {
      case "dashboard":
        return <DashboardModule state={state} onNavigate={goTo} onFocusDepartment={(id) => { setFocusedDepartmentId(id); goTo("budget"); }} />;
      case "productions":
        return <ProductionsModule state={state} dispatch={dispatch} />;
      case "budget":
        return <BudgetModule state={state} search={search} focusedDepartmentId={focusedDepartmentId} dispatch={dispatch} onClearFocus={() => setFocusedDepartmentId(null)} />;
      case "expenses":
        return <ExpensesModule state={state} search={search} dispatch={dispatch} onNavigate={goTo} focusExpenseId={focusExpenseId} onClearExpenseFocus={() => setFocusExpenseId(null)} focusDepartmentId={focusedExpenseDepartmentId} onClearDepartmentFocus={() => setFocusedExpenseDepartmentId(null)} />;
      case "approvals":
        return <ApprovalsModule state={state} search={search} dispatch={dispatch} onOpenExpense={(id) => { setFocusExpenseId(id); goTo("expenses"); }} />;
      case "vendors":
        return <VendorsModule state={state} search={search} />;
      case "crew":
        return <CrewModule state={state} dispatch={dispatch} search={search} />;
      case "reports":
        return <ReportsModule state={state} onNavigate={goTo} />;
      case "ai":
        return <AiModule key={state.selectedProductionId} state={state} onNavigate={goTo} onFocusExpenses={(id) => setFocusedExpenseDepartmentId(id)} />;
      case "settings":
        return <SettingsModule />;
    }
  };

  return <div className="min-h-screen overflow-x-hidden bg-[#070b0f] text-slate-100">
    <div className="mx-auto flex min-h-screen max-w-[1720px]">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/[0.08] bg-[#0a1015] transition-[width] duration-200 lg:flex lg:flex-col ${sidebarOpen ? "w-64" : "w-[76px]"}`}>
        <div className={`flex h-[74px] items-center border-b border-white/[0.08] ${sidebarOpen ? "justify-between px-4" : "justify-center px-2"}`}>
          {sidebarOpen && <a href="#" onClick={(event) => { event.preventDefault(); goTo("dashboard"); }} className="flex items-center gap-3" aria-label="FLOU Pilot home"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-sm font-bold text-amber-200">F</span><span><span className="block text-[13px] font-semibold tracking-[0.28em] text-white">FLOU</span><span className="block text-[9px] uppercase tracking-[0.28em] text-slate-500">Production intelligence</span></span></a>}
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.05] hover:text-white">{sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}</button>
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-2.5 py-5">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => goTo(id)} title={!sidebarOpen ? label : undefined} aria-current={module === id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${module === id ? "bg-amber-300/[0.1] text-amber-100 ring-1 ring-inset ring-amber-300/20" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"} ${sidebarOpen ? "" : "justify-center px-0"}`}><Icon size={17} /><span className={sidebarOpen ? "text-[13px] font-medium" : "sr-only"}>{label}</span>{id === "approvals" && sidebarOpen && <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-200">{state.approvals.filter((item) => item.productionId === state.selectedProductionId && item.status === "Pending").length}</span>}</button>)}
        </nav>
        {sidebarOpen && <div className="m-3 rounded-xl border border-rose-400/10 bg-rose-400/[0.035] p-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-200"><AlertTriangle size={13} /> Forecast alert</div><p className="mt-2 text-xs leading-5 text-slate-300">Forecast is above the current original allocation.</p><button type="button" onClick={() => goTo("ai")} className="mt-2 text-xs font-medium text-amber-200 hover:text-amber-100">Ask Pilot why <span aria-hidden="true">→</span></button></div>}
        {sidebarOpen && <div className="border-t border-white/[0.08] p-4"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Demo workspace</div><div className="mt-1 truncate text-xs text-slate-300">South Coast Pictures</div></div>}
      </aside>
      <main className={`min-w-0 flex-1 transition-[margin] duration-200 lg:ml-64 ${!sidebarOpen ? "lg:ml-[76px]" : ""}`}>
        <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#0a1015]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Open navigation" className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden">{mobileNavOpen ? <X size={17} /> : <Menu size={17} />}</button>
            <div className="relative min-w-0 flex-1">
              <div className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 focus-within:border-amber-300/30">
                <Search size={15} className="shrink-0 text-slate-500" />
                <input ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && searchHits[0]) openSearchHit(searchHits[0]); }} placeholder="Search all records…" aria-label="Search all records" className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none sm:text-sm" />
                {search ? <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="text-slate-500 hover:text-white"><X size={14} /></button> : <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500 sm:block">⌘ K</kbd>}
              </div>
              {search.trim().length > 1 && <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-white/10 bg-[#101922] p-1 shadow-2xl">{searchHits.length ? searchHits.map((hit) => <button key={`${hit.module}-${hit.id}`} type="button" onClick={() => openSearchHit(hit)} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.05]"><span className="min-w-0 truncate text-sm text-slate-100">{hit.title}</span><span className="shrink-0 text-[10px] text-slate-500">{hit.detail}</span></button>) : <p className="px-3 py-4 text-xs text-slate-400">No matching records in this production.</p>}</div>}
            </div>
            <label className="hidden items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <span className="sr-only">Active production</span>
              <select aria-label="Active production" value={state.selectedProductionId} onChange={(event) => dispatch({ type: "production/select", productionId: event.target.value })} className="max-w-40 bg-transparent text-xs text-slate-200 outline-none">{state.productions.map((item) => <option key={item.id} value={item.id} className="bg-[#101922]">{item.name}</option>)}</select>
              <ChevronDown size={13} className="text-slate-500" />
            </label>
            <div className="relative">
              <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} className="relative rounded-xl border border-white/[0.09] p-2.5 text-slate-300 hover:bg-white/[0.04]"><Bell size={16} />{notificationsEnabled && state.approvals.some((item) => item.productionId === state.selectedProductionId && item.status === "Pending") && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-300" />}</button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-40 w-72 rounded-xl border border-white/10 bg-[#101922] p-4 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Notifications</h2><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="text-slate-500"><X size={14} /></button></div><p className="mt-2 text-xs leading-5 text-slate-400">{state.approvals.filter((item) => item.productionId === state.selectedProductionId && item.status === "Pending").length} approvals are waiting for a decision.</p><Button className="mt-3 w-full" onClick={() => { setNotificationsOpen(false); goTo("approvals"); }}>Open approval queue</Button></div>}
            </div>
            <div className="relative">
              <button type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} aria-expanded={profileOpen} className="hidden items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-2 py-1.5 sm:flex"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-xs font-semibold text-white">P</span><span className="hidden text-xs text-slate-300 xl:block">Producer</span><ChevronDown size={13} className="text-slate-500" /></button>
              {profileOpen && <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-white/10 bg-[#101922] p-2 shadow-2xl"><div className="px-2 py-2"><p className="text-xs font-medium text-white">Producer workspace</p><p className="mt-1 text-[10px] text-slate-500">South Coast Pictures</p></div><button type="button" onClick={() => { setProfileOpen(false); goTo("settings"); }} className="w-full rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.05]">Workspace settings</button></div>}
            </div>
          </div>
          {mobileNavOpen && <div className="mt-3 border-t border-white/[0.08] pt-3 lg:hidden"><label htmlFor="mobile-production" className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-slate-500">Active production</label><select id="mobile-production" value={state.selectedProductionId} onChange={(event) => dispatch({ type: "production/select", productionId: event.target.value })} className="mb-3 w-full rounded-lg border border-white/10 bg-[#101922] px-3 py-2 text-sm text-white">{state.productions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><nav aria-label="Mobile navigation" className="grid grid-cols-2 gap-1">{navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => goTo(id)} aria-current={module === id ? "page" : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${module === id ? "bg-amber-300/10 text-amber-100" : "text-slate-400 hover:bg-white/[0.04]"}`}><Icon size={15} />{label}</button>)}</nav></div>}
        </header>
        <div className="mx-auto max-w-[1480px] px-4 py-5 pb-12 sm:px-6 sm:py-7 lg:px-8">
          {!restored && <div className="mb-5 h-16 animate-pulse rounded-2xl border border-white/[0.07] bg-[#101922]" aria-label="Loading saved workspace" />}
          {renderModule()}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4 text-[10px] text-slate-600"><span>FLOU Pilot · Production finance command center</span><span className="flex items-center gap-1.5"><Activity size={12} /> Demo data · browser-local workspace</span></footer>
        </div>
      </main>
    </div>
    {state.notice && <div role={state.notice.kind === "error" ? "alert" : "status"} className={`fixed bottom-5 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl sm:right-6 ${state.notice.kind === "error" ? "border-rose-400/20 bg-[#241215] text-rose-100" : "border-emerald-400/20 bg-[#0e2019] text-emerald-100"}`}><span className="flex-1">{state.notice.message}</span><button type="button" onClick={() => dispatch({ type: "notice/clear" })} aria-label="Dismiss notification"><X size={15} /></button></div>}
  </div>;
}
