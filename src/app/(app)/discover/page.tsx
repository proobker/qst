import Link from "next/link";
import { swipeLeftAction, swipeRightAction } from "@/app/actions/quests";
import { getDiscoveryQuest, getOnboardingState } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DiscoverPage() {
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
        <p className="mt-2 text-sm text-muted">Swipe right to accept. Swipe left to reject.</p>
      </div>

      <article className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">{quest.category}</span>
          <span className="rounded-full border border-border px-2 py-1">{quest.difficulty}</span>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-accent">{quest.xp_reward} XP</span>
          <span className="rounded-full border border-border px-2 py-1">{quest.estimated_time}</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{quest.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-muted">{quest.description}</p>
        {quest.badge_reward ? (
          <p className="mt-3 text-sm text-muted">
            Badge reward: <span className="font-semibold text-accent">{quest.badge_reward}</span>
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form action={swipeLeftAction}>
            <input type="hidden" name="userQuestId" value={assignment.id} />
            <button
              type="submit"
              className="w-full rounded-lg border border-border px-4 py-3 text-sm font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
            >
              Swipe left (reject)
            </button>
          </form>
          <form action={swipeRightAction}>
            <input type="hidden" name="userQuestId" value={assignment.id} />
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Swipe right (accept)
            </button>
          </form>
        </div>
      </article>
    </div>
  );
}
