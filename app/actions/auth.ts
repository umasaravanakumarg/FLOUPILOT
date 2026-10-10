"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, isDemoMode } from "@/lib/supabase/server";
import {
  getRegistrationErrorMessage,
  registrationSchema,
} from "@/lib/supabase/registration";

const credentialsSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(256),
});

export type LoginState = { error?: string };
export type RegistrationState = {
  error?: string;
  status?: "check-email" | "created";
};

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

export async function register(
  _previous: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  if (isDemoMode()) {
    return { error: "Account registration is unavailable in demo mode." };
  }

  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the information entered." };
  }

  const requestHeaders = await headers();
  const originHeader = requestHeaders.get("origin");
  if (!originHeader) {
    throw new Error("The registration request did not include a trusted origin.");
  }
  const origin = new URL(originHeader);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error("The registration request origin is invalid.");
  }
  const emailRedirectTo = new URL("/auth/callback", origin).toString();

  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo,
      },
    });
    if (error) {
      console.warn("Pilot account registration was rejected", {
        status: error.status,
        code: error.code,
      });
      return { error: getRegistrationErrorMessage(error) };
    }
    if (!data.user) {
      console.error("Pilot account registration returned no user and no error.");
      return { error: "Registration could not be completed. Please try again later." };
    }

    return { status: data.session ? "created" : "check-email" };
  } catch (error) {
    console.error("Pilot account registration request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "Registration is temporarily unavailable. Please try again later." };
  }
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
