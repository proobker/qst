import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { LocationPicker } from "@/components/location-picker";
import { getOnboardingState, listHobbies } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [hobbies, onboarding] = await Promise.all([listHobbies(), getOnboardingState(user.id)]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Onboarding</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Select your hobbies and enable location so qst can generate nearby quests.
        </p>
      </div>

      <form action={completeOnboardingAction} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">Step 1 — Choose hobbies</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hobbies.map((hobby) => {
              const checked = onboarding.selectedHobbies.includes(hobby.name);
              return (
                <label
                  key={hobby.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
                >
                  <input type="checkbox" name="hobbies" value={hobby.id} defaultChecked={checked} />
                  {hobby.name}
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">Step 2 — Enable location</h2>
          <LocationPicker defaultLatitude={onboarding.latitude} defaultLongitude={onboarding.longitude} />
        </section>

        <button
          type="submit"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Save onboarding
        </button>
      </form>

      {onboarding.complete ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Onboarding complete. Continue to <Link href="/discover" className="font-semibold underline">quest discovery</Link>.
        </div>
      ) : null}
    </div>
  );
}
