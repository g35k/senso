-- Repair manually seeded auth users so email + password login works.
--
-- Why login fails after only updating encrypted_password:
-- 1) Supabase Auth expects a row in auth.identities for the "email" provider.
--    Seed scripts that only insert auth.users leave identities missing.
-- 2) auth.users may be missing instance_id / aud / role / raw_app_meta_data that
--    normal signups set.
-- 3) GoTrue can return "Database error querying schema" if token columns on
--    auth.users are NULL instead of empty strings (manual inserts often omit them).
--    See: https://github.com/supabase/auth/issues/1940
--
-- Run in Supabase SQL Editor on the SAME project as your VITE_SUPABASE_URL.
--
-- Edit the password literal below if you want a different dev password (meet your project's minimum length).

create extension if not exists pgcrypto with schema extensions;

with inst as (
  select coalesce(
    (select instance_id from auth.users where instance_id is not null limit 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ) as instance_id
),
targets as (
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
  encrypted_password = extensions.crypt('mock123', extensions.gen_salt('bf')),
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
from targets t
where u.email = t.email;

-- Email provider identity: provider_id must be the auth.users id (see Supabase Identities docs).
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
  select 1
  from auth.identities i
  where i.user_id = u.id
    and i.provider = 'email'
);
