"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFullEmailAddress } from "@/lib/utils";

const AUTH_CALLBACK_URL = "https://qst-kappa.vercel.app/auth/callback";

async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: AUTH_CALLBACK_URL,
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
    redirect("/?auth=oauth-error");
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await signInWithOAuth("google");
}

export async function signInWithGitHub() {
  await signInWithOAuth("github");
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email");

  if (typeof email !== "string" || !isFullEmailAddress(email)) {
    redirect("/?auth=invalid-email");
  }

  const trimmedEmail = email.trim().toLowerCase();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmedEmail,
    options: {
      emailRedirectTo: AUTH_CALLBACK_URL,
    },
  });

  if (error) {
    redirect("/?auth=email-error");
  }

  redirect("/?auth=check-email");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
