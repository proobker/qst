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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-amber-900">Finish onboarding first</h1>
        <p className="mt-2 text-sm text-amber-800">
          We need your hobbies and location to generate relevant real-world quests.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Complete onboarding
        </Link>
      </div>
    );
  }

  const assignment = await getDiscoveryQuest(user.id);
  if (!assignment) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-zinc-900">No quest available yet</h1>
        <p className="mt-2 text-sm text-zinc-600">Try refreshing the page to request another AI quest.</p>
      </div>
    );
  }

  const quest = assignment.quests;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Discover a quest</h1>
        <p className="mt-2 text-sm text-zinc-600">Swipe right to accept. Swipe left to reject.</p>
      </div>

      <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <span className="rounded-full border border-zinc-200 px-2 py-1">{quest.category}</span>
          <span className="rounded-full border border-zinc-200 px-2 py-1">{quest.difficulty}</span>
          <span className="rounded-full border border-zinc-200 px-2 py-1">{quest.xp_reward} XP</span>
          <span className="rounded-full border border-zinc-200 px-2 py-1">{quest.estimated_time}</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{quest.title}</h2>
        <p className="mt-3 whitespace-pre-wrap text-zinc-700">{quest.description}</p>
        {quest.badge_reward ? (
          <p className="mt-3 text-sm text-zinc-600">
            Badge reward: <span className="font-semibold text-zinc-900">{quest.badge_reward}</span>
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <form action={swipeLeftAction}>
            <input type="hidden" name="userQuestId" value={assignment.id} />
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Swipe left (reject)
            </button>
          </form>
          <form action={swipeRightAction}>
            <input type="hidden" name="userQuestId" value={assignment.id} />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Swipe right (accept)
            </button>
          </form>
        </div>
      </article>
    </div>
  );
}
