import Link from "next/link";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
} from "@/app/actions/friends";
import { Avatar } from "@/components/avatar";
import { FriendButton } from "@/components/friend-button";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";
import { getFriendRequests, getFriends, searchUsers } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { titleForLevel } from "@/lib/leveling";
import { isFullEmailAddress } from "@/lib/utils";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const tab = params.tab ?? "friends";

  const [friends, requests, searchResults] = await Promise.all([
    getFriends(user.id),
    getFriendRequests(user.id),
    searchUsers(user.id, query),
  ]);

  const tabs = [
    { id: "friends", label: "Friends", count: friends.length },
    { id: "requests", label: "Requests", count: requests.incoming.length + requests.outgoing.length },
    { id: "find", label: "Find People", count: null },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Friends"
        description="Send requests, accept invitations, and build your adventuring party."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.id === "find" ? "/friends?tab=find" : `/friends?tab=${item.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              tab === item.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {item.label}
            {item.count !== null && item.count > 0 ? ` (${item.count})` : ""}
          </Link>
        ))}
      </div>

      {tab === "friends" ? (
        <GlassCard as="section" className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Your friends</h2>
          <div className="mt-4 space-y-3">
            {friends.length === 0 ? (
              <p className="text-sm text-muted">No friends yet. Search for people to connect with.</p>
            ) : null}
            {friends.map((friend) => (
              <div
                key={friend.friendId}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
              >
                <Link href={`/profile/${friend.friendId}`} className="flex items-center gap-3">
                  <Avatar name={friend.friendName} src={friend.friendAvatar} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{friend.friendName}</p>
                    <p className="text-xs text-muted">
                      Level {friend.friendLevel} · {titleForLevel(friend.friendLevel)}
                    </p>
                  </div>
                </Link>
                <form action={removeFriendAction}>
                  <input type="hidden" name="friendId" value={friend.friendId} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-red-400 hover:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {tab === "requests" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Incoming requests</h2>
            <div className="mt-4 space-y-3">
              {requests.incoming.length === 0 ? (
                <p className="text-sm text-muted">No incoming requests.</p>
              ) : null}
              {requests.incoming.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={request.senderName ?? "User"} src={request.senderAvatar} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{request.senderName}</p>
                      <p className="text-xs text-muted">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={acceptFriendRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-background"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={rejectFriendRequestAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Sent requests</h2>
            <div className="mt-4 space-y-3">
              {requests.outgoing.length === 0 ? (
                <p className="text-sm text-muted">No pending sent requests.</p>
              ) : null}
              {requests.outgoing.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={request.receiverName ?? "User"} src={request.receiverAvatar} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{request.receiverName}</p>
                      <p className="text-xs text-muted">Pending</p>
                    </div>
                  </div>
                  <form action={cancelFriendRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      ) : null}

      {tab === "find" ? (
        <section className="space-y-4">
          <GlassCard className="p-6">
            <form className="flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="tab" value="find" />
              <input
                type="email"
                name="q"
                defaultValue={query}
                placeholder="Enter full email address"
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
              <button type="submit" className="btn-primary shrink-0">
                Search
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Search results</h2>
            <div className="mt-4 space-y-3">
              {query && !isFullEmailAddress(query) ? (
                <p className="text-sm text-muted">Enter a complete email address to search.</p>
              ) : null}
              {query && isFullEmailAddress(query) && searchResults.length === 0 ? (
                <p className="text-sm text-muted">No user found with that email.</p>
              ) : null}
              {!query ? (
                <p className="text-sm text-muted">
                  Search by someone&apos;s full email address. Partial names or emails are not supported.
                </p>
              ) : null}
              {searchResults.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <Link href={`/profile/${candidate.id}`} className="flex items-center gap-3">
                    <Avatar name={candidate.name} src={candidate.avatar} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted">
                        Level {candidate.level} · {titleForLevel(candidate.level)}
                      </p>
                    </div>
                  </Link>
                  <FriendButton
                    friendId={candidate.id}
                    status={candidate.friendStatus}
                    requestId={candidate.requestId}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
