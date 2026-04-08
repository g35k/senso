-- Signup failed with: "Database error saving new user"
-- Causes addressed:
-- 1) RLS on public.profiles had no INSERT policy for the role GoTrue uses when
--    running the AFTER INSERT trigger (typically supabase_auth_admin).
-- 2) handle_new_user cast (raw_user_meta_data->>'role')::user_role throws on
--    invalid values; use a safe mapping to student/teacher.
-- 3) Remove broad exception handler so real errors surface in logs instead of
--    leaving orphan auth.users rows without profiles.

grant usage on schema public to supabase_auth_admin;
grant insert on table public.profiles to supabase_auth_admin;

drop policy if exists "profiles_insert_supabase_auth_admin" on public.profiles;

create policy "profiles_insert_supabase_auth_admin"
  on public.profiles
  for insert
  to supabase_auth_admin
  with check (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  assigned_role public.user_role;
  meta_role text;
  user_email text;
begin
  meta_role := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', '')));
  if meta_role = 'teacher' then
    assigned_role := 'teacher'::public.user_role;
  else
    assigned_role := 'student'::public.user_role;
  end if;

  user_email := coalesce(new.email, new.raw_user_meta_data ->> 'email');
  if user_email is null or length(trim(user_email)) = 0 then
    raise exception 'handle_new_user: missing email for user %', new.id;
  end if;

  insert into public.profiles (user_id, email, role)
  values (new.id, trim(user_email), assigned_role);

  return new;
end;
$function$;
