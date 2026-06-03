import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import { HobbyPicker } from "@/components/hobby-picker";
import { Logo } from "@/components/logo";
import { LocationPicker } from "@/components/location-picker";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        title="Onboarding"
        description="Search and select hobbies, then set your location on the map so qst can generate nearby quests."
      >
        <Logo size="md" />
      </PageHeader>

      <form action={completeOnboardingAction} className="glass-card space-y-6 rounded-2xl p-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Step 1 — Choose hobbies</h2>
          <HobbyPicker hobbies={hobbies} defaultSelectedIds={onboarding.selectedHobbyIds} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Step 2 — Set your location</h2>
          <LocationPicker defaultLatitude={onboarding.latitude} defaultLongitude={onboarding.longitude} />
        </section>

        <button type="submit" className="btn-primary">
          Save onboarding
        </button>
      </form>

      {onboarding.complete ? (
        <GlassCard className="border-success/40 bg-success/10 p-4 text-sm text-success">
          Onboarding complete. Continue to{" "}
          <Link href="/discover" className="font-semibold underline">
            quest discovery
          </Link>
          .
        </GlassCard>
      ) : null}
    </div>
  );
}
