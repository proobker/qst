import Link from "next/link";
import { Suspense } from "react";
import { ScrollText } from "lucide-react";
import { getFeed, getFriendLeaderboard, getProfileSummary } from "@/lib/data";
import { PostCard } from "@/components/post-card";
import { AppRail } from "@/components/app-rail";
import { FeedSkeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function FeedContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [feed, summary, leaderboard] = await Promise.all([
    getFeed(user.id),
    getProfileSummary(user.id),
    getFriendLeaderboard(user.id),
  ]);
  const profile = summary.profile;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_18rem] lg:justify-center">
      <div className="space-y-6">
        <PageHeader
          title="Feed"
          subtitle="Quest completions from you and your friends. Friends approve or disapprove; you can edit your own posts."
        />

        <div className="space-y-6">
          {feed.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No posts yet"
              description={
                <>
                  Complete a quest or{" "}
                  <Link href="/friends" className="font-semibold text-primary hover:text-primary-hover">
                    add friends
                  </Link>{" "}
                  to fill your feed.
                </>
              }
            />
          ) : null}

          {feed.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))}
        </div>
      </div>

      {profile ? (
        <AppRail profile={profile} leaderboard={leaderboard} ctaHref="/discover" ctaLabel="Discover a quest" />
      ) : null}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
