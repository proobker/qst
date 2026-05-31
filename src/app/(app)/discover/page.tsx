import Link from "next/link";
import { Suspense } from "react";
import { QuestSwipeDeck } from "@/components/quest-swipe-deck";
import { DiscoverSkeleton } from "@/components/ui/skeleton";
import { getDiscoveryQuest, getOnboardingState } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function DiscoverContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const onboarding = await getOnboardingState(user.id);
  if (!onboarding.complete) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-6">
        <h1 className="text-xl font-semibold text-accent">Finish onboarding first</h1>
        <p className="mt-2 text-sm text-muted">
          We need your hobbies and location to generate relevant real-world quests.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Complete onboarding
        </Link>
      </div>
    );
  }

  const assignment = await getDiscoveryQuest(user.id);
  if (!assignment) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">No quest available yet</h1>
        <p className="mt-2 text-sm text-muted">Try refreshing the page to request another AI quest.</p>
      </div>
    );
  }

  const quest = assignment.quests;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Discover a quest</h1>
        <p className="mt-2 text-sm text-muted">
          Swipe right to accept, left to reject. Drag the card or use arrow keys.
        </p>
      </div>

      <QuestSwipeDeck
        userQuestId={assignment.id}
        quest={{
          id: assignment.quest_id,
          title: quest.title,
          description: quest.description,
          difficulty: quest.difficulty,
          xp_reward: quest.xp_reward,
          estimated_time: quest.estimated_time,
          category: quest.category,
          badge_reward: quest.badge_reward,
        }}
      />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <DiscoverContent />
    </Suspense>
  );
}
