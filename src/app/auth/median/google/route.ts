import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  MEDIAN_GOOGLE_STATE_COOKIE,
} from "@/lib/median-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function redirectWithSecurity(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.delete(MEDIAN_GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const idToken = requestUrl.searchParams.get("idToken");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(MEDIAN_GOOGLE_STATE_COOKIE)?.value;

  cookieStore.delete(MEDIAN_GOOGLE_STATE_COOKIE);

  if (error || type !== "google" || !idToken || !state || !expectedState || state !== expectedState) {
    return redirectWithSecurity(request, "/?auth=oauth-error");
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (signInError) {
    return redirectWithSecurity(request, "/?auth=oauth-error");
  }

  return redirectWithSecurity(request, "/discover");
}
