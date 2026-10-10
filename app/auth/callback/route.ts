import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL("/", origin));
      }
      console.warn("Pilot email confirmation callback failed", {
        status: error.status,
        code: error.code,
      });
    } catch (error) {
      console.error("Pilot email confirmation callback request failed", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  return NextResponse.redirect(new URL("/signup?verification=failed", origin));
}
