-- Mock data seed
-- Note: Inserting into auth.users is for local/dev seeding only.
-- For production-like users, prefer creating users via Supabase Auth APIs.
--
-- encrypted_password must be a bcrypt hash, not plain text. Supabase Auth compares
-- the login password to this hash. pgcrypto provides crypt(..., gen_salt('bf')).

create extension if not exists pgcrypto with schema extensions;

insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values
  ('a1000000-0000-0000-0000-000000000001', 'mrs.johnson@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "teacher"}'),
  ('a1000000-0000-0000-0000-000000000002', 'mr.patel@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "teacher"}'),
  ('b2000000-0000-0000-0000-000000000001', 'alex.rivera@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "student"}'),
  ('b2000000-0000-0000-0000-000000000002', 'maya.chen@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "student"}'),
  ('b2000000-0000-0000-0000-000000000003', 'jordan.kim@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "student"}'),
  ('b2000000-0000-0000-0000-000000000004', 'sofia.torres@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "student"}'),
  ('b2000000-0000-0000-0000-000000000005', 'liam.nguyen@school.edu', extensions.crypt('mock123', extensions.gen_salt('bf')), now(), '{"role": "student"}')
on conflict (id) do nothing;

-- Align with normal Supabase email signups so password login works (hosted + local).
with inst as (
  select coalesce(
    (select instance_id from auth.users where instance_id is not null limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) as instance_id
),
seed_emails as (
  select unnest(array[
    'mrs.johnson@school.edu',
    'mr.patel@school.edu',
    'alex.rivera@school.edu',
    'maya.chen@school.edu',
    'jordan.kim@school.edu',
    'sofia.torres@school.edu',
    'liam.nguyen@school.edu'
  ]::text[]) as email
)
update auth.users u
set
  instance_id = coalesce(u.instance_id, (select instance_id from inst)),
  aud = case when u.aud is null or btrim(u.aud) = '' then 'authenticated' else u.aud end,
  role = case when u.role is null or btrim(u.role) = '' then 'authenticated' else u.role end,
  raw_app_meta_data =
    coalesce(u.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email')
    ),
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  confirmation_token = coalesce(u.confirmation_token, ''),
  recovery_token = coalesce(u.recovery_token, ''),
  email_change = coalesce(u.email_change, ''),
  email_change_token_new = coalesce(u.email_change_token_new, ''),
  email_change_token_current = coalesce(u.email_change_token_current, ''),
  phone_change = coalesce(u.phone_change, ''),
  phone_change_token = coalesce(u.phone_change_token, ''),
  reauthentication_token = coalesce(u.reauthentication_token, ''),
  email_change_confirm_status = coalesce(u.email_change_confirm_status, 0),
  is_sso_user = coalesce(u.is_sso_user, false),
  is_anonymous = coalesce(u.is_anonymous, false),
  created_at = coalesce(u.created_at, now()),
  updated_at = coalesce(u.updated_at, now())
from seed_emails s
where u.email = s.email;

-- Email identities: required for signInWithPassword (provider "email").
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in (
  'mrs.johnson@school.edu',
  'mr.patel@school.edu',
  'alex.rivera@school.edu',
  'maya.chen@school.edu',
  'jordan.kim@school.edu',
  'sofia.torres@school.edu',
  'liam.nguyen@school.edu'
)
and not exists (
  select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
);

insert into profiles (user_id, email, role, created_at)
values
  ('a1000000-0000-0000-0000-000000000001', 'mrs.johnson@school.edu', 'teacher', now()),
  ('a1000000-0000-0000-0000-000000000002', 'mr.patel@school.edu', 'teacher', now()),
  ('b2000000-0000-0000-0000-000000000001', 'alex.rivera@school.edu', 'student', now()),
  ('b2000000-0000-0000-0000-000000000002', 'maya.chen@school.edu', 'student', now()),
  ('b2000000-0000-0000-0000-000000000003', 'jordan.kim@school.edu', 'student', now()),
  ('b2000000-0000-0000-0000-000000000004', 'sofia.torres@school.edu', 'student', now()),
  ('b2000000-0000-0000-0000-000000000005', 'liam.nguyen@school.edu', 'student', now())
on conflict (user_id) do nothing;

insert into teacher (teacher_id, user_id)
values
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002')
on conflict (teacher_id) do nothing;

insert into student (student_id, user_id, teacher_id)
values
  ('e1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002')
on conflict (student_id) do nothing;

insert into chapter (chapter_id, title, "order")
values
  ('c1000000-0000-0000-0000-000000000001', 'Introduction to Braille', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Letters A through E', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Letters F through J', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Letters K through O', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Letters P through T', 5)
on conflict (chapter_id) do nothing;

insert into lesson (lesson_id, chapter_id, title, "order", question_count)
values
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'What is Braille?', 1, 5),
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'The 6-dot cell', 2, 5),
  ('f1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Letter A and B', 1, 5),
  ('f1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'Letters C, D and E', 2, 5),
  ('f1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000003', 'Letters F, G and H', 1, 5),
  ('f1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', 'Letters I and J', 2, 5),
  ('f1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 'Letters K, L and M', 1, 5),
  ('f1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'Letters N and O', 2, 5),
  ('f1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000005', 'Letters P, Q and R', 1, 5),
  ('f1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000005', 'Letters S and T', 2, 5)
on conflict (lesson_id) do nothing;

insert into assigned_lesson (assignment_id, teacher_id, student_id, lesson_id, assigned_at)
values
  ('b3000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', now() - interval '5 days'),
  ('b3000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', now() - interval '4 days'),
  ('b3000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', now() - interval '3 days'),
  ('b3000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', now() - interval '2 days'),
  ('b3000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000004', now() - interval '1 day'),
  ('b3000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', now() - interval '4 days'),
  ('b3000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', now() - interval '3 days'),
  ('b3000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000005', now() - interval '2 days'),
  ('b3000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000006', now() - interval '1 day'),
  ('b3000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000003', now())
on conflict (assignment_id) do nothing;

insert into session (session_id, student_id, lesson_id, score, accuracy, completed_at)
values
  ('b4000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 4, 0.80, now() - interval '5 days'),
  ('b4000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 5, 1.00, now() - interval '4 days'),
  ('b4000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000003', 3, 0.60, now() - interval '3 days'),
  ('b4000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 5, 1.00, now() - interval '3 days'),
  ('b4000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 4, 0.80, now() - interval '2 days'),
  ('b4000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003', 5, 1.00, now() - interval '1 day'),
  ('b4000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', 2, 0.40, now() - interval '2 days'),
  ('b4000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000004', 3, 0.60, now() - interval '1 day'),
  ('b4000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', 5, 1.00, now() - interval '4 days'),
  ('b4000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', 4, 0.80, now() - interval '3 days'),
  ('b4000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000003', 5, 1.00, now() - interval '2 days'),
  ('b4000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000005', 3, 0.60, now() - interval '2 days'),
  ('b4000000-0000-0000-0000-000000000013', 'e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000006', 4, 0.80, now() - interval '1 day')
on conflict (session_id) do nothing;
