"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHobby, saveOnboarding } from "@/lib/data";

export async function addHobbyAction(name: string): Promise<
  | { ok: true; hobby: { id: number; name: string } }
  | { ok: false; message: string }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to add a hobby." };
  }

  const hobby = await createHobby(name);
  if (!hobby) {
    return { ok: false, message: "Enter a valid hobby name." };
  }

  revalidatePath("/onboarding");
  return { ok: true, hobby };
}

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const hobbies = formData.getAll("hobbies").map((value) => Number(value)).filter((value) => Number.isInteger(value));
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  await saveOnboarding(user.id, {
    hobbyIds: hobbies,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  });

  revalidatePath("/onboarding");
  revalidatePath("/discover");
  revalidatePath("/quests");
  redirect("/discover");
}
