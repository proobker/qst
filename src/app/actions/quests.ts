"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { abandonQuest, submitQuestCompletion, swipeQuest } from "@/lib/data";

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

export async function swipeLeftAction(userQuestId: string) {
  const userId = await currentUserId();
  if (!userQuestId) {
    throw new Error("Missing quest id");
  }
  console.log("[QuestSwipe] swipeLeftAction", userQuestId);
  await swipeQuest(userId, userQuestId, "left");
  revalidatePath("/discover");
}

export async function swipeRightAction(userQuestId: string) {
  const userId = await currentUserId();
  if (!userQuestId) {
    throw new Error("Missing quest id");
  }
  console.log("[QuestSwipe] swipeRightAction", userQuestId);
  await swipeQuest(userId, userQuestId, "right");
  revalidatePath("/discover");
  revalidatePath("/quests");
}

export async function uploadQuestCompletionAction(formData: FormData) {
  const userId = await currentUserId();
  const userQuestId = String(formData.get("userQuestId") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  const image = formData.get("image");
  const file = image instanceof File ? image : null;

  if (!userQuestId || !caption) {
    return;
  }

  await submitQuestCompletion(userId, userQuestId, caption, file);
  revalidatePath("/quests");
  revalidatePath("/feed");
}

export async function abandonQuestAction(formData: FormData) {
  const userId = await currentUserId();
  const userQuestId = String(formData.get("userQuestId") ?? "");
  if (!userQuestId) {
    return;
  }

  await abandonQuest(userId, userQuestId);
  revalidatePath("/quests");
}
