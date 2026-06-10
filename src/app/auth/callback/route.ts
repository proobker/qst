import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getSafeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/discover";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL("/", requestUrl.origin);
      errorUrl.searchParams.set("auth", "oauth-error");
      return NextResponse.redirect(errorUrl);
    }
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
