import Link from "next/link";
import Image from "next/image";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { approvePostAction, rejectPostAction, toggleLikeAction } from "@/app/actions/social";
import { Avatar } from "@/components/avatar";
import { FeedPost } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: FeedPost;
};

export function PostCard({ post }: PostCardProps) {
  const user = post.users;
  const quest = post.quests;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/profile/${user?.id ?? post.user_id}`}>
          <Avatar name={user?.name ?? "User"} src={user?.avatar} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${user?.id ?? post.user_id}`}
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {user?.name ?? "Unknown user"}
          </Link>
          {quest ? (
            <p className="truncate text-xs text-muted">
              {quest.title} · {quest.difficulty} · {quest.xp_reward} XP
            </p>
          ) : null}
        </div>
        <time className="text-xs text-muted">{new Date(post.created_at).toLocaleDateString()}</time>
      </div>

      <div className="relative aspect-[4/3] w-full bg-background">
        <Image
          src={post.image_url}
          alt="Quest completion"
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-4">
          <form action={toggleLikeAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium transition",
                post.likedByUser ? "text-primary" : "text-muted hover:text-primary",
              )}
            >
              <Heart size={18} fill={post.likedByUser ? "currentColor" : "none"} />
              {post.likesCount}
            </button>
          </form>
          <span className="text-xs text-muted">
            {post.approvalsCount} votes ({post.approvalPercent.toFixed(0)}% approved)
          </span>
        </div>

        <p className="text-sm leading-relaxed text-foreground">
          <span className="mr-2 font-semibold">{user?.name ?? "User"}</span>
          {post.caption}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <form action={approvePostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                post.votedByUser === true
                  ? "bg-success/20 text-success"
                  : "border border-border text-muted hover:border-success hover:text-success",
              )}
            >
              <ThumbsUp size={16} />
              Approve
            </button>
          </form>
          <form action={rejectPostAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className={cn(
                "flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                post.votedByUser === false
                  ? "bg-red-500/20 text-red-400"
                  : "border border-border text-muted hover:border-red-400 hover:text-red-400",
              )}
            >
              <ThumbsDown size={16} />
              Reject
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
