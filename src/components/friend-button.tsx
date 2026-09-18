import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/app/actions/friends";
import { FriendStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
        <Button
          variant="secondaryDanger"
          size="sm"
          className={cn("min-h-11", className)}
        >
          Remove friend
        </Button>
      </form>
    );
  }

  if (status === "pending_sent" && requestId) {
    return (
      <form action={cancelFriendRequestAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button variant="accent" size="sm" className={cn("min-h-11", className)}>
          Request sent
        </Button>
      </form>
    );
  }

  if (status === "pending_received" && requestId) {
    return (
      <div className={cn("flex gap-2", className)}>
        <form action={acceptFriendRequestAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button variant="success" size="sm" className="min-h-11">
            Accept
          </Button>
        </form>
        <form action={rejectFriendRequestAction}>
          <input type="hidden" name="requestId" value={requestId} />
          <Button variant="secondaryDanger" size="sm" className="min-h-11">
            Decline
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={sendFriendRequestAction}>
      <input type="hidden" name="friendId" value={friendId} />
      <Button size="sm" className={cn("min-h-11", className)}>
        Add friend
      </Button>
    </form>
  );
}
