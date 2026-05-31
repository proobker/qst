import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";
import { FriendStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type FriendButtonProps = {
  friendId: string;
  status: FriendStatus;
  requestId?: string;
  className?: string;
};

export function FriendButton({ friendId, status, requestId, className }: FriendButtonProps) {
  if (status === "friends") {
    return (
      <form action={removeFriendAction}>
        <input type="hidden" name="friendId" value={friendId} />
        <button
          type="submit"
          className={cn(
            "rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-400 hover:text-red-400",
            className,
          )}
        >
          Remove friend
        </button>
      </form>
    );
  }

  if (status === "pending_sent" && requestId) {
    return (
      <form action={cancelFriendRequestAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <button
          type="submit"
          className={cn(
            "rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent",
            className,
          )}
        >
          Request sent
        </button>
      </form>
    );
  }

  if (status === "pending_received" && requestId) {
    return (
      <div className={cn("flex gap-2", className)}>
        <form action={acceptFriendRequestAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-success/90"
          >
            Accept
          </button>
        </form>
        <form action={rejectFriendRequestAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
          >
            Decline
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={sendFriendRequestAction}>
      <input type="hidden" name="friendId" value={friendId} />
      <button
        type="submit"
        className={cn(
          "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-hover",
          className,
        )}
      >
        Add friend
      </button>
    </form>
  );
}
