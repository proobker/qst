import { CalendarDays, Flame, Medal, Trophy } from "lucide-react";
import { acceptDailyQuestAction, skipDailyQuestAction } from "@/app/actions/quests";
import { QuestUploadForm } from "@/components/quest-upload-form";
import { BadgePill } from "@/components/badge-pill";
import { APPROVAL_THRESHOLD_PERCENT, MIN_FRIENDS_REQUIRED } from "@/lib/constants";
import { getDailyQuest, getFriendCount, getStreakSummary } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DailyPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [dailyQuest, streak, friendCount] = await Promise.all([
    getDailyQuest(user.id),
    getStreakSummary(user.id),
    getFriendCount(user.id),
  ]);
  const needsFriends = friendCount < MIN_FRIENDS_REQUIRED;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CalendarDays size={18} />
              Daily Quest
            </div>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Keep your streak alive</h1>
            <p className="mt-2 text-sm text-muted">
              Complete today&apos;s quest, post proof, and get more than {APPROVAL_THRESHOLD_PERCENT}% of your friends
              to approve it before the streak counts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-56">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <Flame size={14} />
                Current
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{streak.currentStreak}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                <Trophy size={14} />
                Best
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">{streak.bestStreak}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Today&apos;s quest</h2>
        {!dailyQuest ? (
          <p className="mt-4 text-sm text-muted">Could not prepare a daily quest right now. Try again in a moment.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-1 text-primary">
                {dailyQuest.status}
              </span>
              <span className="rounded-full border border-border px-2 py-1">{dailyQuest.quest.difficulty}</span>
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-1 text-accent">
                {dailyQuest.quest.xp_reward} XP
              </span>
              <span className="rounded-full border border-border px-2 py-1">{dailyQuest.quest.estimated_time}</span>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">{dailyQuest.quest.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{dailyQuest.quest.description}</p>
              {dailyQuest.quest.badge_reward ? (
                <p className="mt-3 text-sm text-accent">Badge reward: {dailyQuest.quest.badge_reward}</p>
              ) : null}
            </div>

            {needsFriends ? (
              <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
                Add at least {MIN_FRIENDS_REQUIRED} friend before you can submit proof for approval.
              </p>
            ) : null}

            {dailyQuest.status === "generated" ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <form action={acceptDailyQuestAction}>
                  <input type="hidden" name="userQuestId" value={dailyQuest.assignmentId} />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover sm:w-auto"
                  >
                    Accept daily quest
                  </button>
                </form>
                <form action={skipDailyQuestAction}>
                  <input type="hidden" name="userQuestId" value={dailyQuest.assignmentId} />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary sm:w-auto"
                  >
                    Skip today
                  </button>
                </form>
              </div>
            ) : dailyQuest.status === "accepted" ? (
              <QuestUploadForm userQuestId={dailyQuest.assignmentId} />
            ) : dailyQuest.status === "pending_approval" ? (
              <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                Pending approval. Your streak updates after enough friends approve.
              </p>
            ) : dailyQuest.status === "completed" ? (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                Completed. Your streak and rewards have been applied.
              </p>
            ) : dailyQuest.status === "rejected" ? (
              <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
                You skipped today&apos;s daily quest.
              </p>
            ) : dailyQuest.status === "incomplete" ? (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                This daily quest expired before completion.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Medal size={18} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Streak badges</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {streak.streakBadges.map((badge) =>
            badge.earned ? (
              <BadgePill key={badge.badge} name={badge.badge} icon={null} />
            ) : (
              <span
                key={badge.badge}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted"
              >
                {badge.days} days: {badge.badge}
              </span>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
