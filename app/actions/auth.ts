"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, isDemoMode } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(256),
});

export type LoginState = { error?: string };

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  if (isDemoMode()) return { error: "Authentication is not configured for this deployment." };

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.warn("Pilot sign-in was rejected", { status: error.status });
    return { error: "Sign-in failed. Check your credentials or contact your workspace administrator." };
  }
  redirect("/");
}

export async function signOut() {
  if (isDemoMode()) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Pilot sign-out failed", { status: error.status });
    throw new Error("Sign-out could not be completed.");
  }
  redirect("/");
}
