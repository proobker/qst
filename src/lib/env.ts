const requiredClientEnvs = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

const publicClientEnvFallbacks: Record<(typeof requiredClientEnvs)[number], string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://zumlzeeqjknhbvouqhse.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_wpvywY79mu3muaDOoHMCMw_TnZv6EyI",
};

function readEnv(name: string): string {
  const value = process.env[name] ?? publicClientEnvFallbacks[name as (typeof requiredClientEnvs)[number]];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseClientEnv() {
  return {
    url: readEnv(requiredClientEnvs[0]),
    anonKey: readEnv(requiredClientEnvs[1]),
  };
}

export function getGeminiApiKey(): string | undefined {
  const key = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
  const trimmed = key?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/** Optional override, e.g. gemini-2.5-flash-lite */
export function getGeminiModelOverride(): string | undefined {
  const model = process.env.GEMINI_MODEL?.trim();
  return model && model.length > 0 ? model : undefined;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
