insert into public.hobbies (name)
values
  ('Programming'),
  ('Photography'),
  ('Hiking'),
  ('Fitness'),
  ('Reading'),
  ('Food'),
  ('Art'),
  ('Music'),
  ('Volunteering'),
  ('Entrepreneurship')
on conflict (name) do nothing;

insert into public.badges (name, icon)
values
  ('Food Explorer', '🍜'),
  ('Tech Explorer', '💻'),
  ('Photographer', '📸'),
  ('Nature Hunter', '🌿'),
  ('Fitness Warrior', '🏃')
on conflict (name) do nothing;
