-- BrainWhim: daily puzzle days and streaks, saved to the player's account (Oct 31).
-- Run once in the Supabase SQL Editor. Safe to re-run. Contains no keys or passwords.
--
-- Who keeps what (Judy, Oct 31):
--   * Guests (no account, or the anonymous "guest" sign-in): streak lives on their device only.
--   * Free accounts: every daily finish is saved here, so the streak follows them to any phone or computer.
--   * Club members, on top:
--       - Streak Shield: miss ONE day and the streak survives (shield days at least a week apart);
--         applied automatically when they finish the next day's puzzle.
--       - Catch up past days: may finish a missed day's puzzle (up to 30 days back) to mend the streak.
--         (Server side is ready here; the archive screen in the rooms comes later.)
--       - Fancier streak charms: later, from these same records.
--
-- Like The House, the browser plays the puzzle by itself, so the server can't SEE a solve. The rules
-- below only keep the records sane: one row per account, puzzle and day (the first finish is kept);
-- a day must be today or yesterday/tomorrow (time zones), except a Club catch-up; results are small.
-- Nothing here gives points.

create table if not exists public.puzzle_days (
  user_id  uuid not null references auth.users(id) on delete cascade,
  game     text not null,
  day      date not null,
  result   jsonb,
  via      text not null default 'play',   -- play | device (carried over from the device at sign-up) | catchup | shield
  saved_at timestamptz not null default now(),
  primary key (user_id, game, day)
);
alter table public.puzzle_days enable row level security;
revoke all on public.puzzle_days from anon, authenticated;
-- (no policies on purpose: only the functions below can touch it)

-- a real account? (not signed in, or the anonymous guest sign-in, is not)
create or replace function public.bw_puzzle_account()
returns uuid language sql stable security definer
set search_path = public as $$
  select case when auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then null else auth.uid() end;
$$;

-- the streak from the saved days: runs of days in a row (shield days join a run but don't add to it)
create or replace function public.bw_puzzle_calc(uid uuid, p_game text)
returns json language plpgsql stable security definer
set search_path = public as $$
declare cur integer := 0; best integer := 0; lastday date; is_member boolean; last_shield date;
begin
  with g as (
    select day, via, day - (row_number() over (order by day))::integer as grp
      from public.puzzle_days where user_id = uid and game = p_game
  ), isl as (
    select grp, max(day) as e, count(*) filter (where via <> 'shield') as n from g group by grp
  )
  select coalesce((select n from isl order by e desc limit 1), 0),
         coalesce((select max(n) from isl), 0),
         (select max(e) from isl)
    into cur, best, lastday;
  select coalesce(member, false) into is_member from public.profiles where id = uid;
  select max(day) into last_shield from public.puzzle_days where user_id = uid and game = p_game and via = 'shield';
  return json_build_object('ok', true, 'n', cur, 'best', best, 'last', lastday, 'member', coalesce(is_member, false),
    'shieldReady', coalesce(is_member, false) and (last_shield is null or last_shield < current_date - 7),
    'lastShield', last_shield);
end $$;

-- a finished daily puzzle: p_day is the player's own date; p_catchup = a Club member playing a missed day
create or replace function public.bw_puzzle_finish(p_game text, p_day date, p_result jsonb, p_catchup boolean default false)
returns json language plpgsql security definer
set search_path = public as $$
declare uid uuid := public.bw_puzzle_account(); is_member boolean; prev date; last_shield date; shielded date := null; how text := 'play';
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  p_game := left(lower(coalesce(p_game, '')), 20);
  if p_game !~ '^[a-z]+$' then return json_build_object('ok', false, 'error', 'bad_game'); end if;
  if p_day is null then return json_build_object('ok', false, 'error', 'bad_day'); end if;
  if p_result is not null and length(p_result::text) > 400 then p_result := null; end if;
  select coalesce(member, false) into is_member from public.profiles where id = uid;
  if coalesce(p_catchup, false) then
    if not coalesce(is_member, false) then return json_build_object('ok', false, 'error', 'club'); end if;
    if p_day < current_date - 30 or p_day > current_date then return json_build_object('ok', false, 'error', 'bad_day'); end if;
    how := 'catchup';
  elsif p_day < current_date - 1 or p_day > current_date + 1 then
    return json_build_object('ok', false, 'error', 'bad_day');
  end if;

  -- Club Streak Shield: finishing today after missing exactly one day fills that day (one shield in any 7 days)
  if how = 'play' and coalesce(is_member, false) then
    select max(day) into prev from public.puzzle_days where user_id = uid and game = p_game and day < p_day;
    select max(day) into last_shield from public.puzzle_days where user_id = uid and game = p_game and via = 'shield';
    if prev = p_day - 2 and (last_shield is null or last_shield < p_day - 7) then
      insert into public.puzzle_days (user_id, game, day, via) values (uid, p_game, p_day - 1, 'shield') on conflict do nothing;
      shielded := p_day - 1;
    end if;
  end if;

  insert into public.puzzle_days (user_id, game, day, result, via) values (uid, p_game, p_day, p_result, how)
    on conflict (user_id, game, day) do nothing;   -- the first finish of a day is the one kept
  return (public.bw_puzzle_calc(uid, p_game)::jsonb || jsonb_build_object('shielded', shielded))::json;
end $$;

-- the player's streak for one puzzle (shown when a room opens)
create or replace function public.bw_puzzle_streak(p_game text)
returns json language plpgsql stable security definer
set search_path = public as $$
declare uid uuid := public.bw_puzzle_account();
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  return public.bw_puzzle_calc(uid, left(lower(coalesce(p_game, '')), 20));
end $$;

-- a guest who just made an account: carry over the days already finished on this device (last 60 days, up to 60)
-- p_days = [{"day":"2026-10-30","r":{...}}, ...]; marked via='device' so a future leaderboard can leave them out
create or replace function public.bw_puzzle_import(p_game text, p_days jsonb)
returns json language plpgsql security definer
set search_path = public as $$
declare uid uuid := public.bw_puzzle_account(); x jsonb; d date; n integer := 0;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  p_game := left(lower(coalesce(p_game, '')), 20);
  if p_game !~ '^[a-z]+$' then return json_build_object('ok', false, 'error', 'bad_game'); end if;
  if jsonb_typeof(p_days) <> 'array' then return json_build_object('ok', false, 'error', 'bad_days'); end if;
  for x in select value from jsonb_array_elements(p_days) limit 60 loop
    begin d := (x ->> 'day')::date; exception when others then continue; end;
    if d < current_date - 60 or d > current_date + 1 then continue; end if;
    insert into public.puzzle_days (user_id, game, day, result, via)
      values (uid, p_game, d, case when length(coalesce(x -> 'r', 'null'::jsonb)::text) <= 400 then x -> 'r' end, 'device')
      on conflict do nothing;
    if found then n := n + 1; end if;
  end loop;
  return (public.bw_puzzle_calc(uid, p_game)::jsonb || jsonb_build_object('imported', n))::json;
end $$;

revoke all on function public.bw_puzzle_account() from public;
revoke all on function public.bw_puzzle_calc(uuid, text) from public;
revoke all on function public.bw_puzzle_finish(text, date, jsonb, boolean) from public;
revoke all on function public.bw_puzzle_streak(text) from public;
revoke all on function public.bw_puzzle_import(text, jsonb) from public;
grant execute on function public.bw_puzzle_finish(text, date, jsonb, boolean) to authenticated;
grant execute on function public.bw_puzzle_streak(text) to authenticated;
grant execute on function public.bw_puzzle_import(text, jsonb) to authenticated;
-- (bw_puzzle_account and bw_puzzle_calc are helpers: the three functions above call them; browsers can't)
