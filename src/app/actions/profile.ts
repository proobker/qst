"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateProfileBio } from "@/lib/data";

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

export async function updateBioAction(formData: FormData) {
  const userId = await currentUserId();
  const bio = String(formData.get("bio") ?? "");
  await updateProfileBio(userId, bio);
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId}`);
}
