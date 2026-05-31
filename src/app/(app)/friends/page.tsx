import { addFriendAction, removeFriendAction } from "@/app/actions/friends";
import { getFriends, searchUsers } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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
  const [friends, searchResults] = await Promise.all([getFriends(user.id), searchUsers(user.id, query)]);
  const friendIds = new Set(friends.map((friend) => friend.friendId));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Friends</h1>
        <p className="mt-2 text-sm text-zinc-600">Find players, add friends, and verify each other&apos;s quests.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name or email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
            Search
          </button>
        </form>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Your friends</h2>
          <div className="mt-4 space-y-3">
            {friends.length === 0 ? <p className="text-sm text-zinc-600">No friends yet.</p> : null}
            {friends.map((friend) => (
              <div key={friend.friendId} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{friend.friendName}</p>
                  <p className="text-xs text-zinc-500">{friend.friendId}</p>
                </div>
                <form action={removeFriendAction}>
                  <input type="hidden" name="friendId" value={friend.friendId} />
                  <button type="submit" className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Search results</h2>
          <div className="mt-4 space-y-3">
            {query && searchResults.length === 0 ? <p className="text-sm text-zinc-600">No users found.</p> : null}
            {searchResults.map((candidate) => {
              const userId = String(candidate.id);
              const connected = friendIds.has(userId);
              return (
                <div key={userId} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{String(candidate.name)}</p>
                    <p className="text-xs text-zinc-500">{String(candidate.email)}</p>
                  </div>
                  <form action={connected ? removeFriendAction : addFriendAction}>
                    <input type="hidden" name="friendId" value={userId} />
                    <button
                      type="submit"
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        connected
                          ? "border border-zinc-300 text-zinc-700"
                          : "bg-zinc-900 text-white"
                      }`}
                    >
                      {connected ? "Remove" : "Add friend"}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
