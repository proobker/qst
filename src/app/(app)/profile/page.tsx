import { titleForLevel, xpToNextLevel } from "@/lib/leveling";
import { getProfileSummary } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const summary = await getProfileSummary(user.id);
  if (!summary.profile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">{summary.profile.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">{summary.profile.email}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Level</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {summary.profile.level} • {titleForLevel(summary.profile.level)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">XP</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{summary.profile.xp}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">To next level</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{xpToNextLevel(summary.profile.xp)} XP</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Badges</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.badges.length === 0 ? (
            <p className="text-sm text-zinc-600">No badges yet.</p>
          ) : (
            summary.badges.map((badge) => (
              <span key={badge.id} className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-700">
                {badge.name}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Completed quests</h2>
        <p className="mt-2 text-sm text-zinc-600">{summary.completedQuests.length} completed</p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Quest posts</h2>
        <div className="mt-4 space-y-3">
          {summary.posts.length === 0 ? <p className="text-sm text-zinc-600">No posts yet.</p> : null}
          {summary.posts.map((post) => (
            <article key={String(post.id)} className="rounded-lg border border-zinc-200 p-3">
              <p className="text-sm text-zinc-700">{String(post.caption)}</p>
              <p className="mt-1 text-xs text-zinc-500">{new Date(String(post.created_at)).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
