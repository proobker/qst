import { abandonQuestAction, uploadQuestCompletionAction } from "@/app/actions/quests";
import { listUserQuests } from "@/lib/data";
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

export default async function QuestsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const quests = (await listUserQuests(user.id)) as QuestRow[];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Active and completed quests</h1>
        <p className="mt-2 text-sm text-zinc-600">Upload proof when done so friends can verify your completion.</p>
      </div>

      <div className="space-y-4">
        {quests.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No quests yet. Accept one from Discover.
          </div>
        ) : null}

        {quests.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <span className="rounded-full border border-zinc-200 px-2 py-1">{entry.status}</span>
              <span className="rounded-full border border-zinc-200 px-2 py-1">{entry.quests.difficulty}</span>
              <span className="rounded-full border border-zinc-200 px-2 py-1">{entry.quests.xp_reward} XP</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">{entry.quests.title}</h2>
            <p className="mt-2 text-sm text-zinc-700">{entry.quests.description}</p>

            {entry.status === "accepted" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <form action={uploadQuestCompletionAction} className="space-y-2 rounded-lg border border-zinc-200 p-3">
                  <input type="hidden" name="userQuestId" value={entry.id} />
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">Caption</label>
                  <textarea
                    required
                    name="caption"
                    placeholder="Explain what you did to complete this quest."
                    className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Upload photo
                  </label>
                  <input name="image" type="file" accept="image/*" className="block w-full text-sm" />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Upload completion
                  </button>
                </form>

                <form action={abandonQuestAction} className="rounded-lg border border-zinc-200 p-3">
                  <input type="hidden" name="userQuestId" value={entry.id} />
                  <p className="text-sm text-zinc-600">
                    Not interested anymore? Abandoning removes this quest from your active queue.
                  </p>
                  <button
                    type="submit"
                    className="mt-3 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Abandon quest
                  </button>
                </form>
              </div>
            ) : entry.status === "pending_approval" ? (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Pending approval. Your friends decide whether this quest is verified.
              </p>
            ) : entry.status === "completed" ? (
              <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Completed. Rewards have been applied.
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
