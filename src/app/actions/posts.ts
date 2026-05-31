"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { rollbackPostEdit, updatePostImage } from "@/lib/data";

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

export async function updatePostImageAction(formData: FormData) {
  const userId = await currentUserId();
  const postId = String(formData.get("postId") ?? "");
  const image = formData.get("image");
  const metadataRaw = String(formData.get("editMetadata") ?? "{}");
  const file = image instanceof File ? image : null;

  if (!postId || !file || file.size === 0) {
    throw new Error("Missing post or image.");
  }

  let editMetadata: Record<string, unknown> = {};
  try {
    editMetadata = JSON.parse(metadataRaw) as Record<string, unknown>;
  } catch {
    editMetadata = {};
  }

  await updatePostImage(userId, postId, file, editMetadata);
  revalidatePath("/feed");
  revalidatePath("/profile");
}

export async function rollbackPostEditAction(formData: FormData) {
  const userId = await currentUserId();
  const postId = String(formData.get("postId") ?? "");
  if (!postId) {
    return;
  }
  await rollbackPostEdit(userId, postId);
  revalidatePath("/feed");
  revalidatePath("/profile");
}
