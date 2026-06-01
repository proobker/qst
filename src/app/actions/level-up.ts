"use server";

import { revalidatePath } from "next/cache";
import { getPendingLevelUp, markNotificationRead } from "@/lib/data";
import type { LevelUpCelebration } from "@/lib/level-up";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function getPendingLevelUpAction(): Promise<LevelUpCelebration | null> {
  const userId = await currentUserId();
  return getPendingLevelUp(userId);
}

export async function dismissLevelUpAction(notificationId: string): Promise<LevelUpCelebration | null> {
  const userId = await currentUserId();
  if (!notificationId) {
    return null;
  }
  await markNotificationRead(userId, notificationId);
  revalidatePath("/", "layout");
  return getPendingLevelUp(userId);
}
