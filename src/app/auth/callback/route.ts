import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/discover";

  const redirectUrl = new URL(next, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

  if (!code) {
    return response;
  }

  const supabase = createSupabaseRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/?error=auth", requestUrl.origin);
    response = NextResponse.redirect(errorUrl);
    return response;
  }

  return response;
}
