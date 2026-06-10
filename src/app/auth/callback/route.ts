import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ANDROID_PACKAGE_NAME = "app.qst.mobile";
const APP_LINK_HOST = "qst-kappa.vercel.app";

function getSafeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/discover";
}

function getOAuthErrorUrl(requestUrl: URL) {
  const errorUrl = new URL("/", requestUrl.origin);
  errorUrl.searchParams.set("auth", "oauth-error");
  return errorUrl;
}

function redirectToAndroidIntent(requestUrl: URL) {
  const callbackUrl = new URL(requestUrl.toString());
  callbackUrl.protocol = "https:";
  callbackUrl.host = APP_LINK_HOST;

  const fallbackUrl = getOAuthErrorUrl(requestUrl);
  const pathAndSearch = `${APP_LINK_HOST}${callbackUrl.pathname}${callbackUrl.search}`;
  const intentUrl = `intent://${pathAndSearch}#Intent;scheme=https;package=${ANDROID_PACKAGE_NAME};S.browser_fallback_url=${encodeURIComponent(
    fallbackUrl.toString(),
  )};end`;

  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
      Location: intentUrl,
    },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const isNativeCallback = requestUrl.searchParams.get("native") === "1";
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (error) {
    return NextResponse.redirect(getOAuthErrorUrl(requestUrl));
  }

  if (isNativeCallback && code) {
    return redirectToAndroidIntent(requestUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(getOAuthErrorUrl(requestUrl));
    }
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
