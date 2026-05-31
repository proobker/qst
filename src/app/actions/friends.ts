"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addFriend, removeFriend } from "@/lib/data";

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

export async function addFriendAction(formData: FormData) {
  const userId = await currentUserId();
  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId) {
    return;
  }
  await addFriend(userId, friendId);
  revalidatePath("/friends");
}

export async function removeFriendAction(formData: FormData) {
  const userId = await currentUserId();
  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId) {
    return;
  }
  await removeFriend(userId, friendId);
  revalidatePath("/friends");
}
