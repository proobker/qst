create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar text,
  level int not null default 1,
  xp int not null default 0,
  location_enabled boolean not null default false,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hobbies (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.user_hobbies (
  user_id uuid not null references public.users(id) on delete cascade,
  hobby_id bigint not null references public.hobbies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, hobby_id)
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  creator_ai boolean not null default true,
  title text not null,
  description text not null,
  xp_reward int not null default 0,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  badge_reward text,
  estimated_time text not null default '30 min',
  category text not null default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  status text not null check (status in ('generated', 'accepted', 'rejected', 'pending_approval', 'completed', 'abandoned')),
  swiped_at timestamptz,
  started_at timestamptz,
  pending_approval_at timestamptz,
  completed_at timestamptz,
  rejected_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, quest_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  image_url text not null,
  caption text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  vote boolean not null default true,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_1 uuid not null references public.users(id) on delete cascade,
  user_2 uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_1 < user_2),
  unique(user_1, user_2)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists idx_user_quests_user_status on public.user_quests(user_id, status);
create index if not exists idx_posts_user_id on public.posts(user_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_approvals_post_id on public.approvals(post_id);
create index if not exists idx_likes_post_id on public.likes(post_id);

alter table public.users enable row level security;
alter table public.hobbies enable row level security;
alter table public.user_hobbies enable row level security;
alter table public.quests enable row level security;
alter table public.user_quests enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.approvals enable row level security;
alter table public.friendships enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "users read own and others" on public.users;
create policy "users read own and others"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users insert own profile" on public.users;
create policy "users insert own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "hobbies readable by auth users" on public.hobbies;
create policy "hobbies readable by auth users"
  on public.hobbies for select
  to authenticated
  using (true);

drop policy if exists "hobbies insert by auth users" on public.hobbies;
create policy "hobbies insert by auth users"
  on public.hobbies for insert
  to authenticated
  with check (true);

drop policy if exists "user_hobbies owner all" on public.user_hobbies;
create policy "user_hobbies owner all"
  on public.user_hobbies for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quests readable by auth users" on public.quests;
create policy "quests readable by auth users"
  on public.quests for select
  to authenticated
  using (true);

drop policy if exists "quests creatable by auth users" on public.quests;
create policy "quests creatable by auth users"
  on public.quests for insert
  to authenticated
  with check (true);

drop policy if exists "user_quests owner all" on public.user_quests;
create policy "user_quests owner all"
  on public.user_quests for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "posts readable by auth users" on public.posts;
create policy "posts readable by auth users"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "posts owner insert" on public.posts;
create policy "posts owner insert"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "likes readable by auth users" on public.likes;
create policy "likes readable by auth users"
  on public.likes for select
  to authenticated
  using (true);

drop policy if exists "likes owner all" on public.likes;
create policy "likes owner all"
  on public.likes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "approvals readable by auth users" on public.approvals;
create policy "approvals readable by auth users"
  on public.approvals for select
  to authenticated
  using (true);

drop policy if exists "approvals owner all" on public.approvals;
create policy "approvals owner all"
  on public.approvals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "friendships users can read their own edges" on public.friendships;
create policy "friendships users can read their own edges"
  on public.friendships for select
  to authenticated
  using (auth.uid() = user_1 or auth.uid() = user_2);

drop policy if exists "friendships users can create own edges" on public.friendships;
create policy "friendships users can create own edges"
  on public.friendships for insert
  to authenticated
  with check (auth.uid() = user_1 or auth.uid() = user_2);

drop policy if exists "friendships users can delete own edges" on public.friendships;
create policy "friendships users can delete own edges"
  on public.friendships for delete
  to authenticated
  using (auth.uid() = user_1 or auth.uid() = user_2);

drop policy if exists "badges readable by auth users" on public.badges;
create policy "badges readable by auth users"
  on public.badges for select
  to authenticated
  using (true);

drop policy if exists "badges writable by auth users" on public.badges;
create policy "badges writable by auth users"
  on public.badges for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "user_badges readable by auth users" on public.user_badges;
create policy "user_badges readable by auth users"
  on public.user_badges for select
  to authenticated
  using (true);

drop policy if exists "user_badges writable by auth users" on public.user_badges;
create policy "user_badges writable by auth users"
  on public.user_badges for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('quest-completions', 'quest-completions', true)
on conflict (id) do nothing;

drop policy if exists "Public quest completions are viewable" on storage.objects;
create policy "Public quest completions are viewable"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'quest-completions');

drop policy if exists "Users upload own quest completion files" on storage.objects;
create policy "Users upload own quest completion files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'quest-completions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
