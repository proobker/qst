import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const providers = {
  github: "github",
  google: "google",
} as const;

type OAuthProvider = keyof typeof providers;

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider in providers;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const requestUrl = new URL(request.url);

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/?auth=oauth-error", requestUrl.origin));
  }

  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set("next", "/discover");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: providers[provider],
    options: {
      redirectTo: callbackUrl.toString(),
      ...(provider === "google"
        ? {
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          }
        : {}),
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/?auth=oauth-error", requestUrl.origin));
  }

  return NextResponse.redirect(data.url);
}
