import Link from "next/link";
import { Suspense } from "react";
import { QuestSwipeDeck } from "@/components/quest-swipe-deck";
import { DiscoverSkeleton } from "@/components/ui/skeleton";
import { isGeminiInCooldown, getGeminiCooldownRemainingMs } from "@/lib/ai";
import { getGeminiApiKey } from "@/lib/env";
import { getDiscoveryQuest, getOnboardingState } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const hasGeminiKey = Boolean(getGeminiApiKey());
  const { assignments, error } = await getDiscoveryQuest(user.id);

  if (assignments.length === 0) {
    console.error("[DiscoverPage] No quest assignment:", error ?? "unknown");
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Could not load a quest</h1>
        {!hasGeminiKey ? (
          <p className="mt-2 text-sm text-muted">
            Add <code className="text-primary">GOOGLE_GEMINI_API_KEY=your_key</code> to{" "}
            <code className="text-primary">.env.local</code>, then restart{" "}
            <code className="text-primary">npm run dev</code>.
          </p>
        ) : error === "rate_limited" ? (
          <p className="mt-2 text-sm text-muted">
            Gemini free-tier quota is exhausted (HTTP 429). Wait a few minutes and reduce rapid swipes/refreshes
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Gemini or the database failed. Check your terminal for{" "}
            <code className="text-primary">[Gemini]</code> logs.
          </p>
        )}
        <Link
          href="/discover"
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          Try again
        </Link>
      </div>
    );
  }
  const questStack = assignments.map((assignment) => ({
    userQuestId: assignment.id,
    quest: {
      id: assignment.quest_id,
      title: assignment.quests.title,
      description: assignment.quests.description,
      difficulty: assignment.quests.difficulty,
      xp_reward: assignment.quests.xp_reward,
      estimated_time: assignment.quests.estimated_time,
      category: assignment.quests.category,
      badge_reward: assignment.quests.badge_reward,
    },
  }));

  const geminiCooldown = isGeminiInCooldown();
  const cooldownMinutes = Math.ceil(getGeminiCooldownRemainingMs() / 60_000);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Discover a quest</h1>
        <p className="mt-2 text-sm text-muted">
          Swipe right to accept, left to reject. Drag the card or use arrow keys.
        </p>
        {geminiCooldown ? (
          <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            Gemini quota is resting (~{cooldownMinutes} min). Quests use the offline builder until API limits reset.
          </p>
        ) : null}
      </div>
      <QuestSwipeDeck key={questStack[0].userQuestId} quests={questStack} />
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
