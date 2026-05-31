import Image from "next/image";
import { updateBioAction } from "@/app/actions/profile";
import { Avatar } from "@/components/avatar";
import { BadgePill } from "@/components/badge-pill";
import { StatCard } from "@/components/stat-card";
import { XpBar } from "@/components/xp-bar";
import { titleForLevel } from "@/lib/leveling";
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

  const profile = summary.profile;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12">
            <Avatar name={profile.name} src={profile.avatar} size="xl" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted">
            Level {profile.level} · {titleForLevel(profile.level)}
          </p>
          {profile.bio ? <p className="mt-2 text-sm text-foreground">{profile.bio}</p> : null}

          <form action={updateBioAction} className="mt-4 space-y-2">
            <label htmlFor="bio" className="text-xs font-medium uppercase tracking-wide text-muted">
              Edit bio
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              placeholder="Tell others about your adventures..."
              className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Save bio
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Level" value={profile.level} subtext={titleForLevel(profile.level)} />
        <StatCard label="XP" value={profile.xp} />
        <StatCard label="Friends" value={summary.friendsCount} />
        <StatCard label="Quests completed" value={summary.completedQuests.length} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">XP Progress</h2>
        <XpBar xp={profile.xp} level={profile.level} className="mt-4" />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Badges</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {summary.badges.length === 0 ? (
            <p className="text-sm text-muted">No badges yet. Complete quests to earn them.</p>
          ) : (
            summary.badges.map((badge) => <BadgePill key={badge.id} name={badge.name} icon={badge.icon} />)
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Completed quests</h2>
        <div className="mt-4 space-y-2">
          {summary.completedQuests.length === 0 ? (
            <p className="text-sm text-muted">No completed quests yet.</p>
          ) : (
            summary.completedQuests.map((entry) => {
              const quest = entry.quests as { title?: string; category?: string; xp_reward?: number } | null;
              return (
                <div key={entry.id} className="rounded-lg border border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{quest?.title ?? "Quest"}</p>
                  <p className="text-xs text-muted">
                    {quest?.category} · {quest?.xp_reward} XP
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Quest posts</h2>
        {summary.posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No posts yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summary.posts.map((post) => (
              <div key={String(post.id)} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <Image
                  src={String(post.image_url)}
                  alt={String(post.caption)}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
