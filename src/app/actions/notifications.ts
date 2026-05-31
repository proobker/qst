"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/data";

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

export async function markNotificationReadAction(formData: FormData) {
  const userId = await currentUserId();
  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) {
    return;
  }
  await markNotificationRead(userId, notificationId);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const userId = await currentUserId();
  await markAllNotificationsRead(userId);
  revalidatePath("/", "layout");
}
