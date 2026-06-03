import Link from "next/link";
import { Suspense } from "react";
import { QuestSwipeDeck } from "@/components/quest-swipe-deck";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
import { DiscoverSkeleton } from "@/components/ui/skeleton";
import { isGeminiInCooldown, getGeminiCooldownRemainingMs } from "@/lib/ai";
import { getGeminiApiKey } from "@/lib/env";
import { MIN_FRIENDS_REQUIRED } from "@/lib/constants";
import {
  getDiscoveryQuest,
  getFriendCount,
  getOnboardingState,
  toDiscoveryQuestStack,
} from "@/lib/data";
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
      <GlassCard className="border-accent/40 bg-accent/10 p-6">
        <h1 className="text-xl font-semibold text-accent">Finish onboarding first</h1>
        <p className="mt-2 text-sm text-muted">
          We need your hobbies and location to generate relevant real-world quests.
        </p>
        <Link href="/onboarding" className="btn-primary mt-4">
          Complete onboarding
        </Link>
      </GlassCard>
    );
  }

  const friendCount = await getFriendCount(user.id);
  if (friendCount < MIN_FRIENDS_REQUIRED) {
    return (
      <GlassCard className="border-accent/40 bg-accent/10 p-6">
        <h1 className="text-xl font-semibold text-accent">Add a friend first</h1>
        <p className="mt-2 text-sm text-muted">
          You need at least {MIN_FRIENDS_REQUIRED} friend before you can discover quests. Friends also verify your
          completions in the feed.
        </p>
        <Link href="/friends?tab=find" className="btn-primary mt-4">
          Find friends
        </Link>
      </GlassCard>
    );
  }

  const hasGeminiKey = Boolean(getGeminiApiKey());
  const { assignments, error } = await getDiscoveryQuest(user.id);

  if (assignments.length === 0) {
    console.error("[DiscoverPage] No quest assignment:", error ?? "unknown");
    return (
      <GlassCard className="p-6">
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
        <Link href="/discover" className="btn-primary mt-4">
          Try again
        </Link>
      </GlassCard>
    );
  }
  const questStack = toDiscoveryQuestStack(assignments);

  if (questStack.length === 0) {
    console.error("[DiscoverPage] Assignments missing embedded quest data");
    return (
      <GlassCard className="p-6">
        <h1 className="text-xl font-semibold text-foreground">Could not load a quest</h1>
        <p className="mt-2 text-sm text-muted">
          Your quest stack was out of sync. Refresh to generate a new batch.
        </p>
        <Link href="/discover" className="btn-primary mt-4">
          Try again
        </Link>
      </GlassCard>
    );
  }

  const geminiCooldown = isGeminiInCooldown();
  const cooldownMinutes = Math.ceil(getGeminiCooldownRemainingMs() / 60_000);
  const questStackKey = questStack.map((entry) => entry.userQuestId).join(":");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover a quest"
        description="Swipe right to accept, left to reject. Drag the card or use arrow keys."
      >
        {geminiCooldown ? (
          <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
            Gemini quota is resting (~{cooldownMinutes} min). Quests use the offline builder until API limits reset.
          </p>
        ) : null}
      </PageHeader>
      <QuestSwipeDeck key={questStackKey} quests={questStack} />
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
