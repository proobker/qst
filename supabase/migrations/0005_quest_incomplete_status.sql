-- Allow quests to expire as incomplete after the acceptance window.
alter table public.user_quests drop constraint if exists user_quests_status_check;
alter table public.user_quests add constraint user_quests_status_check
  check (status in (
    'generated',
    'accepted',
    'rejected',
    'pending_approval',
    'completed',
    'abandoned',
    'incomplete'
  ));
