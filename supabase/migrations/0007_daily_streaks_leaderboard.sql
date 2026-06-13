-- Daily quests, streak state, and weekly leaderboard support.

alter table public.users
  add column if not exists timezone text not null default 'UTC',
  add column if not exists current_streak int not null default 0,
  add column if not exists best_streak int not null default 0,
  add column if not exists last_daily_completed_on date;

alter table public.user_quests
  add column if not exists source text not null default 'discover',
  add column if not exists source_date date;

alter table public.user_quests drop constraint if exists user_quests_source_check;
alter table public.user_quests add constraint user_quests_source_check
  check (source in ('discover', 'daily'));

alter table public.user_quests drop constraint if exists user_quests_daily_source_date_check;
alter table public.user_quests add constraint user_quests_daily_source_date_check
  check (source <> 'daily' or source_date is not null);

create unique index if not exists user_quests_one_daily_per_user_date
  on public.user_quests(user_id, source_date)
  where source = 'daily' and source_date is not null;

create index if not exists idx_user_quests_daily_lookup
  on public.user_quests(user_id, source, source_date);

create index if not exists idx_user_quests_weekly_completed
  on public.user_quests(user_id, completed_at)
  where status = 'completed';

create index if not exists idx_approvals_user_created_vote
  on public.approvals(user_id, created_at, vote);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'friend_request',
    'friend_accepted',
    'like',
    'approval',
    'level_up',
    'streak_milestone'
  ));

grant select, insert, update on public.user_quests to authenticated;
grant select, update on public.users to authenticated;
grant select on public.approvals to authenticated;
