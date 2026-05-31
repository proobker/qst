const requiredClientEnvs = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

function readEnv(name: string): string {
  const value = process.env[name];
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

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
