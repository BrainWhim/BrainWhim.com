-- BrainWhim: points for games against The House (computer), for any signed-in account.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- The browser plays the computer by itself, so the server cannot SEE the game. It can only limit
-- how much a cheater could ever gain. The rules below make cheating pointless:
--   * a game must be started (bw_house_begin) before it can be finished (bw_house_finish),
--     and each started game can be finished only once;
--   * a game finished in under 45 seconds earns nothing;
--   * win = 2 points, draw = 1, loss = 0 (small on purpose; real rating comes from people);
--   * each account can be awarded points for at most 3 House games per day (20 for Club members).
-- So the most a hacked browser could ever add is 6 points a day (40 for members).

create table if not exists public.house_games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  game        text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  result      text,
  awarded     integer not null default 0
);
create index if not exists house_games_user_day on public.house_games (user_id, finished_at);
alter table public.house_games enable row level security;
revoke all on public.house_games from anon, authenticated;
-- (no policies on purpose: only the functions below can touch it)

create or replace function public.bw_house_begin(p_game text)
returns json language plpgsql security definer
set search_path = public as $$
declare uid uuid := auth.uid(); gid uuid;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  p_game := left(lower(coalesce(p_game,'')), 20);
  if p_game !~ '^[a-z]+$' then return json_build_object('ok', false, 'error', 'bad_game'); end if;
  -- tidy: forget this user's unfinished games older than a day, and cap how many can be open at once
  delete from public.house_games where user_id = uid and finished_at is null and started_at < now() - interval '1 day';
  if (select count(*) from public.house_games where user_id = uid and finished_at is null) >= 10 then
    return json_build_object('ok', false, 'error', 'too_many_open');
  end if;
  insert into public.house_games (user_id, game) values (uid, p_game) returning id into gid;
  return json_build_object('ok', true, 'token', gid);
end $$;

create or replace function public.bw_house_finish(p_token uuid, p_result text)
returns json language plpgsql security definer
set search_path = public as $$
declare
  uid uuid := auth.uid();
  g record;
  is_member boolean;
  cap integer;
  done_today integer;
  pts integer := 0;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  if p_result is null or p_result not in ('win','lose','draw') then
    return json_build_object('ok', false, 'error', 'bad_result');
  end if;

  select * into g from public.house_games where id = p_token and user_id = uid for update;
  if not found then return json_build_object('ok', false, 'error', 'no_game'); end if;
  if g.finished_at is not null then return json_build_object('ok', true, 'already', true, 'awarded', g.awarded); end if;

  select coalesce(member, false) into is_member from public.profiles where id = uid;
  cap := case when is_member then 20 else 3 end;
  select count(*) into done_today from public.house_games
   where user_id = uid and awarded > 0 and finished_at::date = current_date;

  if g.started_at <= now() - interval '45 seconds' and done_today < cap then
    pts := case p_result when 'win' then 2 when 'draw' then 1 else 0 end;
  end if;

  update public.house_games set finished_at = now(), result = p_result, awarded = pts where id = g.id;
  if pts > 0 then
    update public.profiles set skill_points = coalesce(skill_points,0) + pts where id = uid;
  end if;
  return json_build_object('ok', true, 'awarded', pts, 'capped', (done_today >= cap));
end $$;

revoke all on function public.bw_house_begin(text) from public;
revoke all on function public.bw_house_finish(uuid, text) from public;
grant execute on function public.bw_house_begin(text) to authenticated;
grant execute on function public.bw_house_finish(uuid, text) to authenticated;
