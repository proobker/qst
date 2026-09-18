import Link from "next/link";
import { Suspense } from "react";
import { QuestSwipeDeck } from "@/components/quest-swipe-deck";
import { AppRail } from "@/components/app-rail";
import { DiscoverSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { isGeminiInCooldown, getGeminiCooldownRemainingMs } from "@/lib/ai";
import { getGeminiApiKey } from "@/lib/env";
import { MIN_FRIENDS_REQUIRED } from "@/lib/constants";
import { getDiscoveryQuest, getFriendCount, getFriendLeaderboard, getOnboardingState, getProfileSummary } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
        <Link href="/onboarding" className={cn(buttonVariants({ size: "md" }), "mt-4")}>
          Complete onboarding
        </Link>
      </div>
    );
  }

  const friendCount = await getFriendCount(user.id);
  if (friendCount < MIN_FRIENDS_REQUIRED) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-6">
        <h1 className="text-xl font-semibold text-accent">Add a friend first</h1>
        <p className="mt-2 text-sm text-muted">
          You need at least {MIN_FRIENDS_REQUIRED} friend before you can discover quests. Friends also verify your
          completions in the feed.
        </p>
        <Link href="/friends?tab=find" className={cn(buttonVariants({ size: "md" }), "mt-4")}>
          Find friends
        </Link>
      </div>
    );
  }

  const hasGeminiKey = Boolean(getGeminiApiKey());
  const [discovery, summary, leaderboard] = await Promise.all([
    getDiscoveryQuest(user.id),
    getProfileSummary(user.id),
    getFriendLeaderboard(user.id),
  ]);
  const { assignments, error } = discovery;
  const profile = summary.profile;

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
        <Link href="/discover" className={cn(buttonVariants({ size: "md" }), "mt-4")}>
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Discover a quest"
          subtitle="Swipe right to accept, left to reject. Drag the card or use arrow keys."
        >
          {geminiCooldown ? (
            <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
              Gemini quota is resting (~{cooldownMinutes} min). Quests use the offline builder until API limits reset.
            </p>
          ) : null}
        </PageHeader>
        <QuestSwipeDeck quests={questStack} />
      </div>
      {profile ? (
        <AppRail profile={profile} leaderboard={leaderboard} ctaHref="/quests" ctaLabel="View my quests" />
      ) : null}
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
