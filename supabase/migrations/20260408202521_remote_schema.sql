drop extension if exists "pg_net";

create type "public"."user_role" as enum ('student', 'teacher');


  create table "public"."assigned_lesson" (
    "assignment_id" uuid not null default gen_random_uuid(),
    "teacher_id" uuid not null,
    "student_id" uuid not null,
    "lesson_id" uuid not null,
    "assigned_at" timestamp with time zone default now()
      );


alter table "public"."assigned_lesson" enable row level security;


  create table "public"."chapter" (
    "chapter_id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "order" integer not null
      );


alter table "public"."chapter" enable row level security;


  create table "public"."lesson" (
    "lesson_id" uuid not null default gen_random_uuid(),
    "chapter_id" uuid not null,
    "title" text not null,
    "order" integer not null,
    "question_count" integer not null default 0
      );


alter table "public"."lesson" enable row level security;


  create table "public"."profiles" (
    "user_id" uuid not null,
    "email" text not null,
    "role" public.user_role not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."session" (
    "session_id" uuid not null default gen_random_uuid(),
    "student_id" uuid not null,
    "lesson_id" uuid not null,
    "score" integer not null default 0,
    "accuracy" double precision not null default 0.0,
    "completed_at" timestamp with time zone default now()
      );


alter table "public"."session" enable row level security;


  create table "public"."student" (
    "student_id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "teacher_id" uuid
      );


alter table "public"."student" enable row level security;


  create table "public"."teacher" (
    "teacher_id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null
      );


alter table "public"."teacher" enable row level security;

CREATE UNIQUE INDEX assigned_lesson_pkey ON public.assigned_lesson USING btree (assignment_id);

CREATE UNIQUE INDEX assigned_lesson_unique ON public.assigned_lesson USING btree (teacher_id, student_id, lesson_id);

CREATE UNIQUE INDEX chapter_pkey ON public.chapter USING btree (chapter_id);

CREATE UNIQUE INDEX lesson_pkey ON public.lesson USING btree (lesson_id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (user_id);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (session_id);

CREATE UNIQUE INDEX student_pkey ON public.student USING btree (student_id);

CREATE UNIQUE INDEX student_user_id_unique ON public.student USING btree (user_id);

CREATE UNIQUE INDEX teacher_pkey ON public.teacher USING btree (teacher_id);

CREATE UNIQUE INDEX teacher_user_id_unique ON public.teacher USING btree (user_id);

alter table "public"."assigned_lesson" add constraint "assigned_lesson_pkey" PRIMARY KEY using index "assigned_lesson_pkey";

alter table "public"."chapter" add constraint "chapter_pkey" PRIMARY KEY using index "chapter_pkey";

alter table "public"."lesson" add constraint "lesson_pkey" PRIMARY KEY using index "lesson_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."student" add constraint "student_pkey" PRIMARY KEY using index "student_pkey";

alter table "public"."teacher" add constraint "teacher_pkey" PRIMARY KEY using index "teacher_pkey";

alter table "public"."assigned_lesson" add constraint "assigned_lesson_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lesson(lesson_id) ON DELETE CASCADE not valid;

alter table "public"."assigned_lesson" validate constraint "assigned_lesson_lesson_id_fkey";

alter table "public"."assigned_lesson" add constraint "assigned_lesson_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.student(student_id) ON DELETE CASCADE not valid;

alter table "public"."assigned_lesson" validate constraint "assigned_lesson_student_id_fkey";

alter table "public"."assigned_lesson" add constraint "assigned_lesson_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id) ON DELETE CASCADE not valid;

alter table "public"."assigned_lesson" validate constraint "assigned_lesson_teacher_id_fkey";

alter table "public"."assigned_lesson" add constraint "assigned_lesson_unique" UNIQUE using index "assigned_lesson_unique";

alter table "public"."lesson" add constraint "lesson_chapter_id_fkey" FOREIGN KEY (chapter_id) REFERENCES public.chapter(chapter_id) ON DELETE CASCADE not valid;

alter table "public"."lesson" validate constraint "lesson_chapter_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."session" add constraint "session_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lesson(lesson_id) ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_lesson_id_fkey";

alter table "public"."session" add constraint "session_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public.student(student_id) ON DELETE CASCADE not valid;

alter table "public"."session" validate constraint "session_student_id_fkey";

alter table "public"."student" add constraint "student_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id) ON DELETE SET NULL not valid;

alter table "public"."student" validate constraint "student_teacher_id_fkey";

alter table "public"."student" add constraint "student_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."student" validate constraint "student_user_id_fkey";

alter table "public"."student" add constraint "student_user_id_unique" UNIQUE using index "student_user_id_unique";

alter table "public"."teacher" add constraint "teacher_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE not valid;

alter table "public"."teacher" validate constraint "teacher_user_id_fkey";

alter table "public"."teacher" add constraint "teacher_user_id_unique" UNIQUE using index "teacher_user_id_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  assigned_role user_role;
begin
  assigned_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role);

  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, assigned_role);

  return new;
exception
  when others then
    -- Optional: fail-safe to prevent auth signup from breaking due to profile insert issues
    raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
    return new;
end;
$function$
;

grant delete on table "public"."assigned_lesson" to "anon";

grant insert on table "public"."assigned_lesson" to "anon";

grant references on table "public"."assigned_lesson" to "anon";

grant select on table "public"."assigned_lesson" to "anon";

grant trigger on table "public"."assigned_lesson" to "anon";

grant truncate on table "public"."assigned_lesson" to "anon";

grant update on table "public"."assigned_lesson" to "anon";

grant delete on table "public"."assigned_lesson" to "authenticated";

grant insert on table "public"."assigned_lesson" to "authenticated";

grant references on table "public"."assigned_lesson" to "authenticated";

grant select on table "public"."assigned_lesson" to "authenticated";

grant trigger on table "public"."assigned_lesson" to "authenticated";

grant truncate on table "public"."assigned_lesson" to "authenticated";

grant update on table "public"."assigned_lesson" to "authenticated";

grant delete on table "public"."assigned_lesson" to "service_role";

grant insert on table "public"."assigned_lesson" to "service_role";

grant references on table "public"."assigned_lesson" to "service_role";

grant select on table "public"."assigned_lesson" to "service_role";

grant trigger on table "public"."assigned_lesson" to "service_role";

grant truncate on table "public"."assigned_lesson" to "service_role";

grant update on table "public"."assigned_lesson" to "service_role";

grant delete on table "public"."chapter" to "anon";

grant insert on table "public"."chapter" to "anon";

grant references on table "public"."chapter" to "anon";

grant select on table "public"."chapter" to "anon";

grant trigger on table "public"."chapter" to "anon";

grant truncate on table "public"."chapter" to "anon";

grant update on table "public"."chapter" to "anon";

grant delete on table "public"."chapter" to "authenticated";

grant insert on table "public"."chapter" to "authenticated";

grant references on table "public"."chapter" to "authenticated";

grant select on table "public"."chapter" to "authenticated";

grant trigger on table "public"."chapter" to "authenticated";

grant truncate on table "public"."chapter" to "authenticated";

grant update on table "public"."chapter" to "authenticated";

grant delete on table "public"."chapter" to "service_role";

grant insert on table "public"."chapter" to "service_role";

grant references on table "public"."chapter" to "service_role";

grant select on table "public"."chapter" to "service_role";

grant trigger on table "public"."chapter" to "service_role";

grant truncate on table "public"."chapter" to "service_role";

grant update on table "public"."chapter" to "service_role";

grant delete on table "public"."lesson" to "anon";

grant insert on table "public"."lesson" to "anon";

grant references on table "public"."lesson" to "anon";

grant select on table "public"."lesson" to "anon";

grant trigger on table "public"."lesson" to "anon";

grant truncate on table "public"."lesson" to "anon";

grant update on table "public"."lesson" to "anon";

grant delete on table "public"."lesson" to "authenticated";

grant insert on table "public"."lesson" to "authenticated";

grant references on table "public"."lesson" to "authenticated";

grant select on table "public"."lesson" to "authenticated";

grant trigger on table "public"."lesson" to "authenticated";

grant truncate on table "public"."lesson" to "authenticated";

grant update on table "public"."lesson" to "authenticated";

grant delete on table "public"."lesson" to "service_role";

grant insert on table "public"."lesson" to "service_role";

grant references on table "public"."lesson" to "service_role";

grant select on table "public"."lesson" to "service_role";

grant trigger on table "public"."lesson" to "service_role";

grant truncate on table "public"."lesson" to "service_role";

grant update on table "public"."lesson" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."session" to "anon";

grant insert on table "public"."session" to "anon";

grant references on table "public"."session" to "anon";

grant select on table "public"."session" to "anon";

grant trigger on table "public"."session" to "anon";

grant truncate on table "public"."session" to "anon";

grant update on table "public"."session" to "anon";

grant delete on table "public"."session" to "authenticated";

grant insert on table "public"."session" to "authenticated";

grant references on table "public"."session" to "authenticated";

grant select on table "public"."session" to "authenticated";

grant trigger on table "public"."session" to "authenticated";

grant truncate on table "public"."session" to "authenticated";

grant update on table "public"."session" to "authenticated";

grant delete on table "public"."session" to "service_role";

grant insert on table "public"."session" to "service_role";

grant references on table "public"."session" to "service_role";

grant select on table "public"."session" to "service_role";

grant trigger on table "public"."session" to "service_role";

grant truncate on table "public"."session" to "service_role";

grant update on table "public"."session" to "service_role";

grant delete on table "public"."student" to "anon";

grant insert on table "public"."student" to "anon";

grant references on table "public"."student" to "anon";

grant select on table "public"."student" to "anon";

grant trigger on table "public"."student" to "anon";

grant truncate on table "public"."student" to "anon";

grant update on table "public"."student" to "anon";

grant delete on table "public"."student" to "authenticated";

grant insert on table "public"."student" to "authenticated";

grant references on table "public"."student" to "authenticated";

grant select on table "public"."student" to "authenticated";

grant trigger on table "public"."student" to "authenticated";

grant truncate on table "public"."student" to "authenticated";

grant update on table "public"."student" to "authenticated";

grant delete on table "public"."student" to "service_role";

grant insert on table "public"."student" to "service_role";

grant references on table "public"."student" to "service_role";

grant select on table "public"."student" to "service_role";

grant trigger on table "public"."student" to "service_role";

grant truncate on table "public"."student" to "service_role";

grant update on table "public"."student" to "service_role";

grant delete on table "public"."teacher" to "anon";

grant insert on table "public"."teacher" to "anon";

grant references on table "public"."teacher" to "anon";

grant select on table "public"."teacher" to "anon";

grant trigger on table "public"."teacher" to "anon";

grant truncate on table "public"."teacher" to "anon";

grant update on table "public"."teacher" to "anon";

grant delete on table "public"."teacher" to "authenticated";

grant insert on table "public"."teacher" to "authenticated";

grant references on table "public"."teacher" to "authenticated";

grant select on table "public"."teacher" to "authenticated";

grant trigger on table "public"."teacher" to "authenticated";

grant truncate on table "public"."teacher" to "authenticated";

grant update on table "public"."teacher" to "authenticated";

grant delete on table "public"."teacher" to "service_role";

grant insert on table "public"."teacher" to "service_role";

grant references on table "public"."teacher" to "service_role";

grant select on table "public"."teacher" to "service_role";

grant trigger on table "public"."teacher" to "service_role";

grant truncate on table "public"."teacher" to "service_role";

grant update on table "public"."teacher" to "service_role";


  create policy "students can view assigned lessons"
  on "public"."assigned_lesson"
  as permissive
  for select
  to public
using ((student_id IN ( SELECT student.student_id
   FROM public.student
  WHERE (student.user_id = auth.uid()))));



  create policy "teachers can assign lessons"
  on "public"."assigned_lesson"
  as permissive
  for insert
  to public
with check ((teacher_id IN ( SELECT teacher.teacher_id
   FROM public.teacher
  WHERE (teacher.user_id = auth.uid()))));



  create policy "authenticated users can view chapters"
  on "public"."chapter"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "authenticated users can view lessons"
  on "public"."lesson"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "students can insert own sessions"
  on "public"."session"
  as permissive
  for insert
  to public
with check ((student_id IN ( SELECT student.student_id
   FROM public.student
  WHERE (student.user_id = auth.uid()))));



  create policy "students can view own sessions"
  on "public"."session"
  as permissive
  for select
  to public
using ((student_id IN ( SELECT student.student_id
   FROM public.student
  WHERE (student.user_id = auth.uid()))));



  create policy "teachers can view student sessions"
  on "public"."session"
  as permissive
  for select
  to public
using ((student_id IN ( SELECT student.student_id
   FROM public.student
  WHERE (student.teacher_id IN ( SELECT teacher.teacher_id
           FROM public.teacher
          WHERE (teacher.user_id = auth.uid()))))));



  create policy "students can view own record"
  on "public"."student"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "teachers can view their students"
  on "public"."student"
  as permissive
  for select
  to public
using ((auth.uid() IN ( SELECT p.user_id
   FROM (public.teacher t
     JOIN public.profiles p ON ((p.user_id = t.user_id)))
  WHERE (t.teacher_id = student.teacher_id))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


