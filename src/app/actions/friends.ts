"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/lib/data";

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

function revalidateFriendPaths() {
  revalidatePath("/friends");
  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

export async function sendFriendRequestAction(formData: FormData) {
  const userId = await currentUserId();
  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId) {
    return;
  }
  await sendFriendRequest(userId, friendId);
  revalidateFriendPaths();
  revalidatePath(`/profile/${friendId}`);
}

/** @deprecated alias for sendFriendRequestAction */
export async function addFriendAction(formData: FormData) {
  return sendFriendRequestAction(formData);
}

export async function acceptFriendRequestAction(formData: FormData) {
  const userId = await currentUserId();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) {
    return;
  }
  await acceptFriendRequest(userId, requestId);
  revalidateFriendPaths();
}

export async function rejectFriendRequestAction(formData: FormData) {
  const userId = await currentUserId();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) {
    return;
  }
  await rejectFriendRequest(userId, requestId);
  revalidatePath("/friends");
}

export async function cancelFriendRequestAction(formData: FormData) {
  const userId = await currentUserId();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) {
    return;
  }
  await cancelFriendRequest(userId, requestId);
  revalidatePath("/friends");
}

export async function removeFriendAction(formData: FormData) {
  const userId = await currentUserId();
  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId) {
    return;
  }
  await removeFriend(userId, friendId);
  revalidateFriendPaths();
  revalidatePath(`/profile/${friendId}`);
}
