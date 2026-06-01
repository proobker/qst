"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { voteOnPost } from "@/lib/data";

async function currentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}

export async function approvePostAction(formData: FormData) {
  const userId = await currentUserId();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    return;
  }

  const postOwnerId = await voteOnPost(userId, postId, true);
  revalidatePath("/feed");
  revalidatePath("/quests");
  revalidatePath("/profile");
  if (postOwnerId) {
    revalidatePath(`/profile/${postOwnerId}`);
  }
  revalidatePath("/", "layout");
}

export async function disapprovePostAction(formData: FormData) {
  const userId = await currentUserId();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    return;
  }

  const postOwnerId = await voteOnPost(userId, postId, false);
  revalidatePath("/feed");
  revalidatePath("/quests");
  revalidatePath("/profile");
  if (postOwnerId) {
    revalidatePath(`/profile/${postOwnerId}`);
  }
  revalidatePath("/", "layout");
}

/** @deprecated use disapprovePostAction */
export async function rejectPostAction(formData: FormData) {
  return disapprovePostAction(formData);
}
