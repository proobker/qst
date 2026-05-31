-- Post edit tracking
alter table public.posts
  add column if not exists edited_at timestamptz,
  add column if not exists edit_count int not null default 0;

-- Edit history for rollback, moderation, and audit
create table if not exists public.post_edit_history (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  editor_id uuid not null references public.users(id) on delete cascade,
  previous_image_url text not null,
  previous_caption text,
  edit_metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_edit_history_post_id
  on public.post_edit_history(post_id, created_at desc);

alter table public.post_edit_history enable row level security;

drop policy if exists "post_edit_history readable by auth users" on public.post_edit_history;
create policy "post_edit_history readable by auth users"
  on public.post_edit_history for select
  to authenticated
  using (true);

drop policy if exists "post_edit_history insertable by editor" on public.post_edit_history;
create policy "post_edit_history insertable by editor"
  on public.post_edit_history for insert
  to authenticated
  with check (auth.uid() = editor_id);

-- Allow post owners to update their posts
drop policy if exists "posts owner update" on public.posts;
create policy "posts owner update"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow overwriting own storage files on edit
drop policy if exists "Users update own quest completion files" on storage.objects;
create policy "Users update own quest completion files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'quest-completions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
