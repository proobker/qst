import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { HobbyPicker } from "@/components/hobby-picker";
import { Logo } from "@/components/logo";
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
  const isUpdating = onboarding.complete;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <Logo size="md" className="mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isUpdating ? "Update onboarding" : "Onboarding"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {isUpdating
            ? "Update your hobbies and location so qst can tune future quest discovery."
            : "Search and select hobbies, then set your location on the map so qst can generate nearby quests."}
        </p>
      </div>

      <form action={completeOnboardingAction} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Step 1 — Choose hobbies</h2>
          <HobbyPicker hobbies={hobbies} defaultSelectedIds={onboarding.selectedHobbyIds} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Step 2 — Set your location</h2>
          <LocationPicker defaultLatitude={onboarding.latitude} defaultLongitude={onboarding.longitude} />
        </section>

        <button
          type="submit"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          {isUpdating ? "Save changes" : "Save onboarding"}
        </button>
      </form>

      {onboarding.complete ? (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm text-success">
          Onboarding complete. Continue to{" "}
          <Link href="/discover" className="font-semibold underline">
            quest discovery
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}
