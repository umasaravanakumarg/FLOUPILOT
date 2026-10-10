"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/actions/auth";
import { Button, Card, fieldClass } from "./ui";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <Card className="w-full">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Secure pilot workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Sign in to FLOU Pilot</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Use the account provisioned by your workspace administrator. Self-service registration is disabled.</p>
        <form action={action} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300" htmlFor="pilot-email">Email
            <input id="pilot-email" name="email" type="email" autoComplete="username" required maxLength={254} className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-slate-300" htmlFor="pilot-password">Password
            <input id="pilot-password" name="password" type="password" autoComplete="current-password" required maxLength={256} className={`${fieldClass} mt-2`} />
          </label>
          {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
          <Button type="submit" variant="primary" disabled={pending} className="w-full">{pending ? "Signing in…" : "Sign in"}</Button>
        </form>
      </Card>
    </main>
  );
}
