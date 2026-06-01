-- Allow authenticated users to read completed quests on any profile.
drop policy if exists "user_quests completed readable for profiles" on public.user_quests;
create policy "user_quests completed readable for profiles"
  on public.user_quests for select
  to authenticated
  using (status = 'completed');

-- Allow friend counts on any user's public profile.
drop policy if exists "friendships readable for public profiles" on public.friendships;
create policy "friendships readable for public profiles"
  on public.friendships for select
  to authenticated
  using (true);
