import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export function isDemoMode() {
  const hasUrl = Boolean(process.env.SUPABASE_URL);
  const hasKey = Boolean(process.env.SUPABASE_ANON_KEY);
  if (!hasUrl && !hasKey) return true;
  if (!hasUrl || !hasKey) {
    throw new Error("Supabase mode requires both SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return false;
}

export function assertSupabaseConfiguration() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("Supabase mode requires SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = assertSupabaseConfiguration();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes sessions.
        }
      },
    },
  });
}
