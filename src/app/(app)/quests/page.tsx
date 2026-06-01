import { Suspense } from "react";
import { QuestUploadForm } from "@/components/quest-upload-form";
import { QuestListSkeleton } from "@/components/ui/skeleton";
import { abandonQuestAction } from "@/app/actions/quests";
import { MIN_FRIENDS_REQUIRED, QUEST_ACCEPT_DEADLINE_HOURS } from "@/lib/constants";
import { getFriendCount, listUserQuests } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QuestRow = {
  id: string;
  status: string;
  quests: {
    title: string;
    description: string;
    xp_reward: number;
    difficulty: string;
  };
};

async function QuestsContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [quests, friendCount] = await Promise.all([
    listUserQuests(user.id) as Promise<QuestRow[]>,
    getFriendCount(user.id),
  ]);
  const needsFriends = friendCount < MIN_FRIENDS_REQUIRED;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Active and completed quests</h1>
        <p className="mt-2 text-sm text-muted">
          Upload proof with the built-in photo editor so friends can verify your completion. Accepted quests expire
          after {QUEST_ACCEPT_DEADLINE_HOURS} hours if not finished.
        </p>
        {needsFriends ? (
          <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
            Add at least {MIN_FRIENDS_REQUIRED} friend before you can submit proof for approval.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {quests.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
            No quests yet. Accept one from Discover.
          </div>
        ) : null}

        {quests.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-border bg-surface p-6 transition-shadow hover:shadow-md hover:shadow-primary/5"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                {entry.status}
              </span>
              <span className="rounded-full border border-border px-2 py-1">{entry.quests.difficulty}</span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-accent">
                {entry.quests.xp_reward} XP
              </span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{entry.quests.title}</h2>
            <p className="mt-2 text-sm text-muted">{entry.quests.description}</p>

            {entry.status === "accepted" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <QuestUploadForm userQuestId={entry.id} />

                <form action={abandonQuestAction} className="rounded-lg border border-border p-3">
                  <input type="hidden" name="userQuestId" value={entry.id} />
                  <p className="text-sm text-muted">
                    Not interested anymore? Abandoning removes this quest from your active queue.
                  </p>
                  <button
                    type="submit"
                    className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
                  >
                    Abandon quest
                  </button>
                </form>
              </div>
            ) : entry.status === "pending_approval" ? (
              <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                Pending approval. Your friends decide whether this quest is verified.
              </p>
            ) : entry.status === "completed" ? (
              <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                Completed. Rewards have been applied.
              </p>
            ) : entry.status === "incomplete" ? (
              <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                Incomplete — this quest was not finished within {QUEST_ACCEPT_DEADLINE_HOURS} hours of accepting it.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

export default function QuestsPage() {
  return (
    <Suspense fallback={<QuestListSkeleton />}>
      <QuestsContent />
    </Suspense>
  );
}
