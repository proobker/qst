import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseClientEnv } from "@/lib/env";

/** Supabase client that writes session cookies onto a specific Route Handler response. */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, anonKey } = getSupabaseClientEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
