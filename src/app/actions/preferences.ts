"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateUserTimezone } from "@/lib/data";

export async function updateTimezoneAction(timezone: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !timezone) {
    return;
  }

  await updateUserTimezone(user.id, timezone);
  revalidatePath("/", "layout");
}
