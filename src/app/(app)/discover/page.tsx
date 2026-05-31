import Link from "next/link";
import { Suspense } from "react";
import { QuestSwipeDeck } from "@/components/quest-swipe-deck";
import { DiscoverSkeleton } from "@/components/ui/skeleton";
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
  const { assignment, error } = await getDiscoveryQuest(user.id);

  if (!assignment) {
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
            Gemini free-tier quota is exhausted (HTTP 429). Wait a few minutes, reduce rapid swipes/refreshes,
            or enable billing in{" "}
            <a
              href="https://aistudio.google.com/apikey"
              className="font-semibold text-primary hover:text-primary-hover"
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>
            . Only one quest is generated per swipe now to save quota.
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

  const quest = assignment.quests;
  if (!quest) {
    console.error("[DiscoverPage] Assignment exists but quest data is missing:", assignment);
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Quest data error</h1>
        <p className="mt-2 text-sm text-muted">Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Discover a quest</h1>
        <p className="mt-2 text-sm text-muted">
          Swipe right to accept, left to reject. Drag the card or use arrow keys.
        </p>
      </div>

      <QuestSwipeDeck
        key={assignment.id}
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
