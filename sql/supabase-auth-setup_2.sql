-- BrainWhim: auth + daily-match setup  (PART 1: safe to run, only adds things)
-- Supabase dashboard > SQL Editor > New query > paste all > Run.

-- ---------- columns the site reads ----------
alter table public.profiles add column if not exists member boolean not null default false;
alter table public.profiles add column if not exists skill_points integer not null default 0;
alter table public.profiles add column if not exists online_day date;
alter table public.profiles add column if not exists online_count integer not null default 0;
alter table public.profiles add column if not exists last_seen timestamptz;

-- unique usernames, case-insensitive (ignore the error if you already have one)
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username)) where username is not null;

-- ---------- does this email / phone / username already have an account? ----------
create or replace function public.bw_identity_status(ident text, kind text)
returns json language plpgsql security definer stable
set search_path = public, auth as $$
declare ex boolean;
begin
  if kind = 'email' then
    select exists(select 1 from auth.users where lower(email) = lower(trim(ident))) into ex;
  elsif kind = 'phone' then
    select exists(select 1 from auth.users
      where coalesce(phone,'') <> ''
        and regexp_replace(phone,'\D','','g') = regexp_replace(ident,'\D','','g')) into ex;
  else
    select exists(select 1 from public.profiles where lower(username) = lower(trim(ident))) into ex;
  end if;
  return json_build_object('exists', ex);
end $$;

-- ---------- username -> login email (lets people sign in by username) ----------
create or replace function public.bw_login_email(n text)
returns text language sql security definer stable
set search_path = public, auth as $$
  select u.email::text
  from public.profiles p join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(n)) limit 1;
$$;

-- ---------- is this username available? ----------
create or replace function public.bw_username_free(n text)
returns boolean language sql security definer stable
set search_path = public as $$
  select not exists(select 1 from public.profiles where lower(username) = lower(trim(n)));
$$;

-- ---------- count one match toward today's limit of 3 (members are unlimited) ----------
create or replace function public.bw_consume_match()
returns json language plpgsql security definer
set search_path = public as $$
declare
  uid uuid := auth.uid();
  p record;
  lim constant int := 3;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;

  select member, online_day, online_count into p
  from public.profiles where id = uid for update;
  if not found then return json_build_object('ok', false, 'error', 'no_profile'); end if;

  if p.member then return json_build_object('ok', true, 'member', true); end if;

  if p.online_day is distinct from current_date then
    p.online_count := 0;
  end if;

  if p.online_count >= lim then
    return json_build_object('ok', false, 'member', false, 'used', p.online_count);
  end if;

  update public.profiles
     set online_day = current_date, online_count = p.online_count + 1
   where id = uid;
  return json_build_object('ok', true, 'member', false, 'used', p.online_count + 1);
end $$;

-- ---------- let the browser call these (and nothing else gets new powers) ----------
revoke all on function public.bw_identity_status(text,text) from public;
revoke all on function public.bw_login_email(text) from public;
revoke all on function public.bw_username_free(text) from public;
revoke all on function public.bw_consume_match() from public;
grant execute on function public.bw_identity_status(text,text) to anon, authenticated;
grant execute on function public.bw_login_email(text) to anon, authenticated;
grant execute on function public.bw_username_free(text) to anon, authenticated;
grant execute on function public.bw_consume_match() to authenticated;

-- make the existing score function run with owner rights, so it keeps working after the lock-down
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'apply_skill_delta'
  loop
    execute format('alter function %s security definer set search_path = public', f);
  end loop;
end $$;
