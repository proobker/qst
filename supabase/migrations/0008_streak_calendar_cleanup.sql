-- Cleanup after 0007: normal quests drive the streak calendar now.
-- Keep users.timezone so calendar days can be grouped in the user's local time.

drop index if exists public.user_quests_one_daily_per_user_date;
drop index if exists public.idx_user_quests_daily_lookup;

alter table public.user_quests drop constraint if exists user_quests_daily_source_date_check;
alter table public.user_quests drop constraint if exists user_quests_source_check;

alter table public.user_quests
  drop column if exists source_date,
  drop column if exists source;

alter table public.users
  drop column if exists current_streak,
  drop column if exists best_streak,
  drop column if exists last_daily_completed_on;

create index if not exists idx_user_quests_calendar_completed
  on public.user_quests(user_id, completed_at)
  where status = 'completed';
