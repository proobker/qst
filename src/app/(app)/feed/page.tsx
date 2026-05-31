import Link from "next/link";
import { Suspense } from "react";
import { getFeed } from "@/lib/data";
import { PostCard } from "@/components/post-card";
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
      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-bold text-foreground">Feed</h1>
        <p className="mt-2 text-sm text-muted">
          Quest completions from you and your friends. Like, approve, or edit your own posts.
        </p>
      </div>

      <div className="space-y-6">
        {feed.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">No posts yet.</p>
            <p className="mt-2 text-sm text-muted">
              Complete a quest or{" "}
              <Link href="/friends" className="font-semibold text-primary hover:text-primary-hover">
                add friends
              </Link>{" "}
              to fill your feed.
            </p>
          </div>
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
