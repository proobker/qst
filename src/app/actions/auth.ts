"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";
import { isFullEmailAddress } from "@/lib/utils";

const TEST_PASSWORD_SIGN_IN_ERROR = "We could not sign you in with those credentials.";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TestPasswordSignInState = {
  message: string;
};

function getAuthUrl(path: string) {
  return new URL(path, getAppUrl()).toString();
}

async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthUrl("/auth/callback"),
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
      emailRedirectTo: getAuthUrl("/auth/callback"),
    },
  });

  if (error) {
    redirect("/?auth=email-error");
  }

  redirect("/?auth=check-email");
}

async function resolveTestPasswordEmail(identifier: string): Promise<string | null> {
  const trimmedIdentifier = identifier.trim();

  if (isFullEmailAddress(trimmedIdentifier)) {
    return trimmedIdentifier.toLowerCase();
  }

  if (!UUID_PATTERN.test(trimmedIdentifier)) {
    return null;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.getUserById(trimmedIdentifier);

    if (error || !user?.email) {
      return null;
    }

    return user.email.toLowerCase();
  } catch {
    return null;
  }
}

export async function signInWithTestPassword(
  _state: TestPasswordSignInState,
  formData: FormData,
): Promise<TestPasswordSignInState> {
  const identifier = formData.get("identifier");
  const password = formData.get("password");

  if (typeof identifier !== "string" || typeof password !== "string" || password.length === 0) {
    return { message: TEST_PASSWORD_SIGN_IN_ERROR };
  }

  const email = await resolveTestPasswordEmail(identifier);
  if (!email) {
    return { message: TEST_PASSWORD_SIGN_IN_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: TEST_PASSWORD_SIGN_IN_ERROR };
  }

  redirect("/discover");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
