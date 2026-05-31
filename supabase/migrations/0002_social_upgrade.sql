-- Add bio to users
alter table public.users add column if not exists bio text;

-- Friend requests (Facebook-style workflow)
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id),
  unique (sender_id, receiver_id)
);

create index if not exists idx_friend_requests_receiver_status
  on public.friend_requests(receiver_id, status);

create index if not exists idx_friend_requests_sender_status
  on public.friend_requests(sender_id, status);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('friend_request', 'friend_accepted', 'like', 'approval', 'level_up')),
  actor_id uuid references public.users(id) on delete set null,
  entity_id uuid,
  entity_type text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_read
  on public.notifications(user_id, read, created_at desc);

alter table public.friend_requests enable row level security;
alter table public.notifications enable row level security;

-- Friend request policies
drop policy if exists "friend_requests readable by participants" on public.friend_requests;
create policy "friend_requests readable by participants"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "friend_requests insertable by sender" on public.friend_requests;
create policy "friend_requests insertable by sender"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "friend_requests updatable by receiver" on public.friend_requests;
create policy "friend_requests updatable by receiver"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

drop policy if exists "friend_requests deletable by participants" on public.friend_requests;
create policy "friend_requests deletable by participants"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Notification policies
drop policy if exists "notifications readable by owner" on public.notifications;
create policy "notifications readable by owner"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications insertable by auth users" on public.notifications;
create policy "notifications insertable by auth users"
  on public.notifications for insert
  to authenticated
  with check (true);

drop policy if exists "notifications updatable by owner" on public.notifications;
create policy "notifications updatable by owner"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
