"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Heart, Pencil, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { updatePostImageAction, rollbackPostEditAction } from "@/app/actions/posts";
import { approvePostAction, rejectPostAction, toggleLikeAction } from "@/app/actions/social";
import { Avatar } from "@/components/avatar";
import { ImageEditor } from "@/components/image-editor";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { FeedPost } from "@/lib/types";
import type { ImageEditSettings } from "@/lib/image-editor";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: FeedPost;
  currentUserId?: string;
};

export function PostCard({ post, currentUserId }: PostCardProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const user = post.users;
  const quest = post.quests;
  const isOwner = currentUserId === post.user_id;

  function handleEditSave(file: File, metadata: ImageEditSettings) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);
      formData.set("image", file);
      formData.set("editMetadata", JSON.stringify(metadata));
      try {
        await updatePostImageAction(formData);
        toast("Post updated!", "success");
        setEditorOpen(false);
      } catch {
        toast("Failed to update post.", "error");
      }
    });
  }

  function handleRollback() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("postId", post.id);
      try {
        await rollbackPostEditAction(formData);
        toast("Post restored to previous version.", "success");
      } catch {
        toast("Rollback failed.", "error");
      }
    });
  }

  return (
    <>
      <article className="overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-primary/5">
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
          <div className="flex items-center gap-2">
            {post.edited_at ? (
              <span className="rounded-full border border-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                Edited
              </span>
            ) : null}
            <time className="text-xs text-muted">{new Date(post.created_at).toLocaleDateString()}</time>
          </div>
        </div>

        <div className="relative aspect-[4/3] w-full bg-background">
          <Image
            src={post.image_url}
            alt="Quest completion"
            fill
            unoptimized
            className="object-cover"
          />
          {pending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Spinner size="lg" label="Saving..." />
            </div>
          ) : null}
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

          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary hover:text-primary"
              >
                <Pencil size={14} />
                Edit post
              </button>
              {post.edit_count > 0 ? (
                <button
                  type="button"
                  onClick={handleRollback}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
                >
                  <RotateCcw size={14} />
                  Rollback
                </button>
              ) : null}
            </div>
          ) : null}

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

      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialImageUrl={post.image_url}
        title="Edit post image"
        onSave={handleEditSave}
      />
    </>
  );
}
