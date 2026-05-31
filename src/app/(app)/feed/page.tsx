import Image from "next/image";
import { approvePostAction, rejectPostAction, toggleLikeAction } from "@/app/actions/social";
import { getFeed } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FeedPost = {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
  users: { id: string; name: string; avatar: string | null } | null;
  quests: { title: string; difficulty: string; xp_reward: number } | null;
  likesCount: number;
  approvalsCount: number;
  approvalPercent: number;
  likedByUser: boolean;
  votedByUser: boolean | null;
};

export default async function FeedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const feed = (await getFeed(user.id)) as FeedPost[];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Social feed</h1>
        <p className="mt-2 text-sm text-zinc-600">Like and approve friends&apos; quest completions.</p>
      </div>

      <div className="space-y-4">
        {feed.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            No posts yet. Complete and upload a quest to start the feed.
          </div>
        ) : null}

        {feed.map((post) => (
          <article key={post.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <Image
              src={post.image_url}
              alt="Quest completion"
              width={1200}
              height={800}
              unoptimized
              className="h-72 w-full object-cover"
            />
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600">
                <p>
                  <span className="font-semibold text-zinc-900">{post.users?.name ?? "Unknown user"}</span> •{" "}
                  {new Date(post.created_at).toLocaleString()}
                </p>
                <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {post.quests?.title ?? "Quest"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700">{post.caption}</p>
              <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <span className="rounded-full border border-zinc-200 px-2 py-1">{post.likesCount} likes</span>
                <span className="rounded-full border border-zinc-200 px-2 py-1">
                  {post.approvalsCount} votes ({post.approvalPercent.toFixed(0)}% approved)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <form action={toggleLikeAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    {post.likedByUser ? "Unlike" : "Like"}
                  </button>
                </form>
                <form action={approvePostAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-md px-3 py-2 text-sm font-semibold transition ${
                      post.votedByUser === true
                        ? "bg-emerald-100 text-emerald-900"
                        : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectPostAction}>
                  <input type="hidden" name="postId" value={post.id} />
                  <button
                    type="submit"
                    className={`w-full rounded-md px-3 py-2 text-sm font-semibold transition ${
                      post.votedByUser === false
                        ? "bg-rose-100 text-rose-900"
                        : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
