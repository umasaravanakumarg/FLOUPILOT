import { connection } from "next/server";
import { FlouApp } from "@/components/flou-app";
import { LoginForm } from "@/components/login-form";
import { createInitialState } from "@/lib/demo-state";
import { loadFinanceState } from "@/lib/supabase/data-access";
import { createSupabaseServerClient, isDemoMode } from "@/lib/supabase/server";

export const instant = false;

export default async function Home() {
  await connection();
  if (isDemoMode()) return <FlouApp mode="demo" initialState={createInitialState()} />;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Pilot page session verification failed", { status: error.status });
    throw new Error("The secure pilot session could not be verified.");
  }
  if (!data.user) return <LoginForm />;

  const state = await loadFinanceState(supabase, data.user.id);
  if (!state.productions.length) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-12">
        <section className="rounded-2xl border border-white/10 bg-[#101922] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">Authenticated pilot</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">No production access is configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Your account is signed in, but it has no active tenant and production memberships. Ask a workspace administrator to provision access. Demo fixtures are not loaded in authenticated mode.</p>
        </section>
      </main>
    );
  }

  return <FlouApp mode="supabase" initialState={state} />;
}
