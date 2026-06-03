import Link from "next/link";
import { Suspense } from "react";
import { getFeed } from "@/lib/data";
import { PostCard } from "@/components/post-card";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
import { FeedSkeleton } from "@/components/ui/skeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function FeedContent() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const feed = await getFeed(user.id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Feed"
        description="Quest completions from you and your friends. Friends approve or disapprove; you can edit your own posts."
      />

      <div className="space-y-6">
        {feed.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted">No posts yet.</p>
            <p className="mt-2 text-sm text-muted">
              Complete a quest or{" "}
              <Link href="/friends" className="font-semibold text-primary hover:text-primary-hover">
                add friends
              </Link>{" "}
              to fill your feed.
            </p>
          </GlassCard>
        ) : null}

        {feed.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={user.id} />
        ))}
      </div>
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
