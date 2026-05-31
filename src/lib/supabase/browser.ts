"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseClientEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseClientEnv();
  return createBrowserClient(url, anonKey);
}
