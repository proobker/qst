"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/env";
import { isFullEmailAddress } from "@/lib/utils";

const TEST_PASSWORD_SIGN_IN_ERROR = "We could not sign you in with those credentials.";
const DELETE_ACCOUNT_ERROR = "We could not delete your account. Please try again.";
const QUEST_COMPLETIONS_BUCKET = "quest-completions";
const STORAGE_PAGE_SIZE = 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type TestPasswordSignInState = {
  message: string;
};

export type DeleteAccountState = {
  message: string;
};

type StorageBucketApi = ReturnType<ReturnType<typeof createSupabaseAdminClient>["storage"]["from"]>;

type StorageListItem = {
  name: string;
  id: string | null;
};

function getAuthUrl(path: string) {
  return new URL(path, getAppUrl()).toString();
}

function storagePath(parent: string, child: string) {
  return parent ? `${parent}/${child}` : child;
}

async function listStorageObjectPaths(storage: StorageBucketApi, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list(prefix, {
      limit: STORAGE_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(error.message);
    }

    const items = (data ?? []) as StorageListItem[];
    for (const item of items) {
      const path = storagePath(prefix, item.name);
      if (item.id) {
        paths.push(path);
      } else {
        paths.push(...(await listStorageObjectPaths(storage, path)));
      }
    }

    if (items.length < STORAGE_PAGE_SIZE) {
      break;
    }

    offset += STORAGE_PAGE_SIZE;
  }

  return paths;
}

async function deleteUserStorageObjects(userId: string) {
  const admin = createSupabaseAdminClient();
  const storage = admin.storage.from(QUEST_COMPLETIONS_BUCKET);
  const paths = await listStorageObjectPaths(storage, userId);

  for (let index = 0; index < paths.length; index += STORAGE_PAGE_SIZE) {
    const chunk = paths.slice(index, index + STORAGE_PAGE_SIZE);
    const { error } = await storage.remove(chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
}

async function getUserQuestIds(userId: string): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const [assignmentsResult, postsResult] = await Promise.all([
    admin.from("user_quests").select("quest_id").eq("user_id", userId),
    admin.from("posts").select("quest_id").eq("user_id", userId),
  ]);

  if (assignmentsResult.error) {
    throw new Error(assignmentsResult.error.message);
  }

  if (postsResult.error) {
    throw new Error(postsResult.error.message);
  }

  const questIds = [
    ...((assignmentsResult.data as Array<{ quest_id: string }> | null) ?? []).map((row) => row.quest_id),
    ...((postsResult.data as Array<{ quest_id: string }> | null) ?? []).map((row) => row.quest_id),
  ];

  return Array.from(new Set(questIds));
}

async function deleteUnreferencedGeneratedQuests(questIds: string[]) {
  if (questIds.length === 0) {
    return;
  }

  const admin = createSupabaseAdminClient();

  for (const questId of questIds) {
    const [assignmentsResult, postsResult] = await Promise.all([
      admin.from("user_quests").select("id", { count: "exact", head: true }).eq("quest_id", questId),
      admin.from("posts").select("id", { count: "exact", head: true }).eq("quest_id", questId),
    ]);

    if (assignmentsResult.error || postsResult.error) {
      console.error("[AccountDeletion] Failed to check quest references:", {
        questId,
        assignmentsError: assignmentsResult.error,
        postsError: postsResult.error,
      });
      continue;
    }

    if ((assignmentsResult.count ?? 0) === 0 && (postsResult.count ?? 0) === 0) {
      const { error } = await admin.from("quests").delete().eq("id", questId).eq("creator_ai", true);
      if (error) {
        console.error("[AccountDeletion] Failed to delete unreferenced quest:", { questId, error });
      }
    }
  }
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

export async function deleteAccountAction(
  _state: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirmation = formData.get("confirmation");
  if (confirmation !== "DELETE") {
    return { message: "Type DELETE to confirm account deletion." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: "You must be signed in to delete your account." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const questIds = await getUserQuestIds(user.id);

    await deleteUserStorageObjects(user.id);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      throw new Error(deleteUserError.message);
    }

    await deleteUnreferencedGeneratedQuests(questIds);
    await supabase.auth.signOut().catch(() => undefined);
  } catch (error) {
    console.error("[AccountDeletion] Failed to delete account:", error);
    return { message: DELETE_ACCOUNT_ERROR };
  }

  redirect("/?account=deleted");
}
