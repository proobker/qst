import { Suspense } from "react";
import { QuestUploadForm } from "@/components/quest-upload-form";
import { QuestListSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { abandonQuestAction } from "@/app/actions/quests";
import { APPROVAL_THRESHOLD_PERCENT, MIN_FRIENDS_REQUIRED, QUEST_ACCEPT_DEADLINE_HOURS } from "@/lib/constants";
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
<PageHeader
        title="Active and completed quests"
        subtitle={`Upload proof with the built-in photo editor so friends can verify your completion. Accepted quests expire after ${QUEST_ACCEPT_DEADLINE_HOURS} hours if not finished.`}
      >
        {needsFriends ? (
          <p className="mt-3 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
            Add at least {MIN_FRIENDS_REQUIRED} friend before you can submit proof for approval.
          </p>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        {quests.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
            No quests yet. Accept one from Discover.
          </div>
        ) : null}

        {quests.map((entry) => (
          <Card key={entry.id} className="p-6" interactive>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
              <Pill variant="primary">{entry.status}</Pill>
              <Pill variant="neutral">{entry.quests.difficulty}</Pill>
              <Pill variant="accent">{entry.quests.xp_reward} XP</Pill>
            </div>
            <h2 className="text-xl font-semibold text-foreground">{entry.quests.title}</h2>
            <p className="mt-2 text-sm text-muted">{entry.quests.description}</p>

            {entry.status === "accepted" ? (
              <div className="mt-4 grid gap-4">
                <QuestUploadForm userQuestId={entry.id} />

                <form action={abandonQuestAction} className="rounded-lg border border-border p-3">
                  <input type="hidden" name="userQuestId" value={entry.id} />
                  <p className="text-sm text-muted">
                    Not interested anymore? Abandoning removes this quest from your active queue.
                  </p>
                  <Button type="submit" variant="secondaryDanger" size="sm" className="mt-3">
                    Abandon quest
                  </Button>
                </form>
              </div>
            ) : entry.status === "pending_approval" ? (
              <p className="mt-3 rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                Pending approval — needs more than {APPROVAL_THRESHOLD_PERCENT}% of your friends to approve to
                award XP.
              </p>
            ) : entry.status === "completed" ? (
              <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                Completed. Rewards have been applied.
              </p>
            ) : entry.status === "incomplete" ? (
              <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                Incomplete — this quest was not finished within {QUEST_ACCEPT_DEADLINE_HOURS} hours of accepting it.
              </p>
            ) : null}
          </Card>
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
