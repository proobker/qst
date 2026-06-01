import Image from "next/image";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BadgePill } from "@/components/badge-pill";
import { FriendButton } from "@/components/friend-button";
import { StatCard } from "@/components/stat-card";
import { XpBar } from "@/components/xp-bar";
import { titleForLevel } from "@/lib/leveling";
import { getFriendRelationship, getProfileSummary } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const summary = await getProfileSummary(userId);
  if (!summary.profile) {
    notFound();
  }

  const profile = summary.profile;
  const isOwnProfile = user?.id === userId;
  const relationship = user && !isOwnProfile ? await getFriendRelationship(user.id, userId) : null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <Avatar name={profile.name} src={profile.avatar} size="xl" />
            {relationship ? (
              <FriendButton
                friendId={userId}
                status={relationship.status}
                requestId={relationship.requestId}
              />
            ) : null}
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted">
            Level {profile.level} · {titleForLevel(profile.level)}
          </p>
          {profile.bio ? <p className="mt-2 text-sm text-foreground">{profile.bio}</p> : null}
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
            <p className="text-sm text-muted">No badges yet.</p>
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
                {post.edited_at ? (
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Edited
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
