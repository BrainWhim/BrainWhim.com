-- BrainWhim auth setup. Run in Supabase -> SQL Editor. Safe to run more than once.
-- PART 1 and 2 are required by bw-auth.js. PART 3 is the security lock-down: run it AFTER the new site files are live.

-- ============ PART 1: columns + unique usernames ============
alter table public.profiles add column if not exists username      text;
alter table public.profiles add column if not exists display_name  text;
alter table public.profiles add column if not exists skill_points  integer default 0;
alter table public.profiles add column if not exists member        boolean default false;
alter table public.profiles add column if not exists online_day    text;
alter table public.profiles add column if not exists online_count  integer default 0;
alter table public.profiles add column if not exists last_seen     timestamptz;
alter table public.profiles add column if not exists is_guest      boolean default false;

-- If this fails with "could not create unique index", two accounts share a username. Rename one, then re-run.
create unique index if not exists profiles_username_lower_uq on public.profiles (lower(username)) where username is not null;

-- ============ PART 2: functions used by the sign-in window ============

-- Does an account exist for this email / phone / username?  (returns only true/false, never the email)
create or replace function public.bw_identity_status(ident text, kind text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare found boolean := false; v text := lower(trim(coalesce(ident, '')));
begin
  if v = '' then return jsonb_build_object('exists', false); end if;
  if kind = 'email' then
    select exists(select 1 from auth.users where lower(email) = v) into found;
  elsif kind = 'phone' then
    select exists(select 1 from auth.users where phone = regexp_replace(v, '\D', '', 'g')) into found;
  else
    select exists(select 1 from public.profiles where lower(username) = v) into found;
  end if;
  return jsonb_build_object('exists', found);
end $$;

-- Is this username free?
create or replace function public.bw_username_free(n text)
returns boolean language sql security definer set search_path = public as $$
  select not exists(select 1 from public.profiles where lower(username) = lower(trim(n)));
$$;

-- Username -> email, so "log in with username" works. This must reveal the email to the browser,
-- which is the trade-off of username login without a server function. It replaces email_for_username
-- and only answers for one exact username at a time.
create or replace function public.bw_login_email(n text)
returns text language sql security definer set search_path = public, auth as $$
  select u.email::text
  from public.profiles p join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(n)) and u.email is not null
  limit 1;
$$;

-- Count one match for the signed-in user. Free accounts get 3 a day; members are unlimited.
create or replace function public.bw_consume_match()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); today text := to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD');
        lim constant int := 3; p record;
begin
  if uid is null then return jsonb_build_object('ok', false, 'reason', 'signin'); end if;
  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  select member, online_day, coalesce(online_count, 0) as cnt into p from public.profiles where id = uid for update;
  if coalesce(p.member, false) then return jsonb_build_object('ok', true, 'member', true); end if;
  if p.online_day is distinct from today then
    update public.profiles set online_day = today, online_count = 1 where id = uid;
    return jsonb_build_object('ok', true, 'used', 1, 'limit', lim);
  end if;
  if p.cnt >= lim then return jsonb_build_object('ok', false, 'used', p.cnt, 'limit', lim); end if;
  update public.profiles set online_count = p.cnt + 1 where id = uid;
  return jsonb_build_object('ok', true, 'used', p.cnt + 1, 'limit', lim);
end $$;

revoke all on function public.bw_identity_status(text, text) from public;
revoke all on function public.bw_username_free(text)         from public;
revoke all on function public.bw_login_email(text)           from public;
revoke all on function public.bw_consume_match()             from public;
grant execute on function public.bw_identity_status(text, text) to anon, authenticated;
grant execute on function public.bw_username_free(text)         to anon, authenticated;
grant execute on function public.bw_login_email(text)           to anon, authenticated;
grant execute on function public.bw_consume_match()             to authenticated;

-- ============ PART 3: lock-down (run AFTER the new site files are deployed) ============
-- Stops browsers from granting themselves membership or reading other people's emails.
-- skill_points stays writable for now because play-rooms.js still updates it from the browser;
-- moving that to a server function is the next security task.

-- alter table public.profiles enable row level security;
-- revoke update on public.profiles from anon, authenticated;
-- grant  update (username, display_name, last_seen, skill_points) on public.profiles to authenticated;
-- revoke select on public.profiles from anon, authenticated;
-- grant  select (id, username, display_name, skill_points, member, last_seen, is_guest, online_day, online_count) on public.profiles to anon, authenticated;
-- drop function if exists public.email_for_username(text);
--
-- After PART 3, bw_consume_match() (security definer) still updates online_day / online_count,
-- so the daily limit keeps working. Your RLS policies must still allow users to insert/update their OWN row.
