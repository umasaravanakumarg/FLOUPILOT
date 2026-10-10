"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type RegistrationState } from "@/app/actions/auth";
import { Button, Card, fieldClass } from "./ui";

const initialState: RegistrationState = {};

export function SignupForm({ verificationFailed = false }: { verificationFailed?: boolean }) {
  const [state, action, pending] = useActionState(register, initialState);

  if (state.status === "check-email") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:py-12">
        <Card className="w-full">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Secure pilot workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Check your email</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            If an account can be registered with that address, Supabase will send a confirmation link. Open it in this browser to verify your email.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Already registered? <Link href="/" className="font-medium text-amber-300 hover:text-amber-200">Sign in</Link>. New accounts still need a workspace administrator to grant access.
          </p>
        </Card>
      </main>
    );
  }

  if (state.status === "created") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:py-12">
        <Card className="w-full">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Secure pilot workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Account created</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your account is ready. A workspace administrator must provision tenant and production access before you can use FLOU Pilot.
          </p>
          <Link href="/" className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-amber-400 px-3.5 py-2 text-sm font-medium text-slate-950 hover:bg-amber-300">
            Continue
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:py-12">
      <Card className="w-full">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-300">Secure pilot workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create an account, then ask your workspace administrator to provision your access.
        </p>
        {verificationFailed && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm leading-6 text-rose-300">
            The email confirmation link could not be verified. It may have expired or already been used. Try registering again or sign in if your email is already verified.
          </p>
        )}
        <form action={action} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300" htmlFor="signup-name">Name
            <input id="signup-name" name="name" type="text" autoComplete="name" required minLength={2} maxLength={80} className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-slate-300" htmlFor="signup-email">Email
            <input id="signup-email" name="email" type="email" autoComplete="email" required maxLength={254} className={`${fieldClass} mt-2`} />
          </label>
          <label className="block text-sm text-slate-300" htmlFor="signup-password">Password
            <input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="signup-password-hint" className={`${fieldClass} mt-2`} />
            <span id="signup-password-hint" className="mt-1 block text-xs text-slate-500">At least 8 characters, with a letter and a number.</span>
          </label>
          <label className="block text-sm text-slate-300" htmlFor="signup-password-confirmation">Confirm password
            <input id="signup-password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={`${fieldClass} mt-2`} />
          </label>
          {state.error && <p role="alert" className="text-sm leading-6 text-rose-300">{state.error}</p>}
          <Button type="submit" variant="primary" disabled={pending} className="w-full">{pending ? "Creating account…" : "Create account"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-amber-300 hover:text-amber-200">Sign in</Link>
        </p>
      </Card>
    </main>
  );
}
