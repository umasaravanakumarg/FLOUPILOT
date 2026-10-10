"use client";

import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const formatMoney = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const formatCr = (paise: number) =>
  `₹${(paise / 100 / 10_000_000).toFixed(2)} Cr`;

export const formatLakhs = (paise: number) => {
  const lakhs = paise / 100 / 100_000;
  const digits = Number.isInteger(lakhs) ? 0 : 1;
  return `₹${lakhs.toFixed(digits)} L`;
};

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-[#0a1117] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/10";

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
}) {
  const styles = {
    primary: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    secondary: "border border-white/10 bg-white/[0.035] text-slate-200 hover:border-white/20 hover:bg-white/[0.07]",
    ghost: "text-slate-300 hover:bg-white/[0.06] hover:text-white",
    danger: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30 hover:bg-rose-500/25",
    success: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/[0.09] bg-[#101922] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)] ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">{eyebrow}</p>}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "watch" | "risk" | "neutral";
}) {
  const toneClass = {
    good: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
    watch: "bg-amber-500/10 text-amber-200 ring-amber-500/25",
    risk: "bg-rose-500/10 text-rose-300 ring-rose-500/25",
    neutral: "bg-slate-500/10 text-slate-300 ring-slate-500/25",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${toneClass[tone]}`}>{label}</span>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-modal="true"
        aria-label={title}
        role="dialog"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101922] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-white/[0.07]"><table className="w-full min-w-[680px] border-collapse text-left text-sm">{children}</table></div>;
}
