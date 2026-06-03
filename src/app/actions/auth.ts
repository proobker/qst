"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";
import { isFullEmailAddress } from "@/lib/utils";

export type EmailOtpState = {
  ok: boolean;
  email: string;
  message: string;
};

const initialEmailOtpState: EmailOtpState = {
  ok: false,
  email: "",
  message: "",
};

export async function requestEmailOtpAction(
  previousState: EmailOtpState = initialEmailOtpState,
  formData: FormData,
): Promise<EmailOtpState> {
  void previousState;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!isFullEmailAddress(email)) {
    return {
      ok: false,
      email,
      message: "Enter a complete email address.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? getAppUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/discover`,
    },
  });

  if (error) {
    console.error("[Auth] Failed to send email OTP:", error);
    return {
      ok: false,
      email,
      message: "Could not send the login code. Try again in a moment.",
    };
  }

  return {
    ok: true,
    email,
    message: "Check your email for a one-time login code.",
  };
}

export async function verifyEmailOtpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim().replace(/\s/g, "");

  if (!isFullEmailAddress(email) || token.length < 6) {
    redirect("/?error=otp");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("[Auth] Failed to verify email OTP:", error);
    redirect("/?error=otp");
  }

  redirect("/discover");
}

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? getAppUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
