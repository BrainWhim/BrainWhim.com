-- BrainWhim: server-side scoring (item 2).  Run after supabase-lockdown.sql.
-- Supabase dashboard > SQL Editor > New query > paste all > Run.
--
-- How scoring works after this:
--   * Browsers can no longer call apply_skill_delta (the old "set anyone's points" function).
--   * Each player's browser reports the result of a finished game: bw_report_result(room, winner).
--   * The SERVER decides whether points move, and how many:
--       - a player saying "the other side won" (a concession) is believed right away;
--       - a draw needs both players to report a draw;
--       - a player claiming their OWN win is not believed on their own, so a hacked browser
--         can't award itself points. If both claim a win, nobody gets points.
--   * One result per room, ever. No points for games under 30 seconds, and a pair of accounts
--     can earn points from each other at most 3 times a day (anti-farming).

create table if not exists public.game_reports (
  room_id    text not null,
  user_id    uuid not null,
  winner     integer not null check (winner in (0,1,2)),   -- 0 draw, 1 host, 2 guest
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create table if not exists public.game_results (
  room_id     text primary key,
  winner      integer not null,
  host_delta  integer not null default 0,
  guest_delta integer not null default 0,
  applied_at  timestamptz not null default now()
);
alter table public.game_reports enable row level security;
alter table public.game_results enable row level security;
revoke all on public.game_reports, public.game_results from anon, authenticated;
-- (no policies on purpose: only the function below, which runs with owner rights, can touch them)

-- same tier rules the site shows: New <=100, Beginner <=500, Club <=1000, Expert above
create or replace function public.bw_tier_index(pts integer) returns integer
language sql immutable as $$
  select case when coalesce(pts,0) <= 100 then 0 when pts <= 500 then 1 when pts <= 1000 then 2 else 3 end;
$$;

create or replace function public.bw_rate_delta(my integer, opp integer, result text) returns integer
language sql immutable as $$
  select case
    when result = 'draw' then 0
    when result = 'win'  then case when public.bw_tier_index(opp) > public.bw_tier_index(my) then 12
                                   when public.bw_tier_index(opp) < public.bw_tier_index(my) then 4 else 8 end
    else                      case when public.bw_tier_index(opp) > public.bw_tier_index(my) then -2
                                   when public.bw_tier_index(opp) < public.bw_tier_index(my) then -8 else -4 end
  end;
$$;

create or replace function public.bw_report_result(p_room text, p_winner integer)
returns json language plpgsql security definer
set search_path = public as $$
declare
  uid uuid := auth.uid();
  r record;
  my integer; hr integer; gr integer; w integer;
  hp integer; gp integer; hd integer := 0; gd integer := 0;
  pairs integer;
begin
  if uid is null then return json_build_object('ok', false, 'error', 'signin'); end if;
  if p_winner is null or p_winner not in (0,1,2) then return json_build_object('ok', false, 'error', 'bad_result'); end if;

  perform pg_advisory_xact_lock(hashtext(p_room));

  select id, host, guest, created_at into r from public.rooms where id::text = p_room;
  if not found or r.host is null or r.guest is null or r.host = r.guest then
    return json_build_object('ok', false, 'error', 'no_room');
  end if;
  if uid = r.host then my := 1; elsif uid = r.guest then my := 2;
  else return json_build_object('ok', false, 'error', 'not_player'); end if;

  if exists (select 1 from public.game_results where room_id = p_room) then
    return json_build_object('ok', true, 'already', true);
  end if;

  -- first report from a player stands; it can't be changed afterwards
  insert into public.game_reports (room_id, user_id, winner) values (p_room, uid, p_winner)
  on conflict (room_id, user_id) do nothing;

  select winner into hr from public.game_reports where room_id = p_room and user_id = r.host;
  select winner into gr from public.game_reports where room_id = p_room and user_id = r.guest;

  w := null;
  if hr = 2 or gr = 1 then                       -- someone conceded: believe the player who lost
    if hr = 2 and gr = 1 then w := null;         -- both "conceded" to each other: contradiction
    elsif hr = 2 then w := 2; else w := 1; end if;
  elsif hr = 0 and gr = 0 then w := 0;           -- both report a draw
  end if;

  if w is null then return json_build_object('ok', true, 'pending', true); end if;

  -- no points for instant games, or for a pair farming each other
  select count(*) into pairs
  from public.game_results gres join public.rooms ro on ro.id::text = gres.room_id
  where gres.applied_at::date = current_date
    and (gres.host_delta <> 0 or gres.guest_delta <> 0)
    and ((ro.host = r.host and ro.guest = r.guest) or (ro.host = r.guest and ro.guest = r.host));

  if w <> 0
     and (r.created_at is null or r.created_at <= now() - interval '30 seconds')
     and pairs < 3 then
    perform 1 from public.profiles where id in (r.host, r.guest) order by id for update;
    select skill_points into hp from public.profiles where id = r.host;
    select skill_points into gp from public.profiles where id = r.guest;
    hd := public.bw_rate_delta(hp, gp, case when w = 1 then 'win' else 'lose' end);
    gd := public.bw_rate_delta(gp, hp, case when w = 2 then 'win' else 'lose' end);
    update public.profiles set skill_points = greatest(0, coalesce(skill_points,0) + hd) where id = r.host;
    update public.profiles set skill_points = greatest(0, coalesce(skill_points,0) + gd) where id = r.guest;
  end if;

  insert into public.game_results (room_id, winner, host_delta, guest_delta) values (p_room, w, hd, gd);
  return json_build_object('ok', true, 'applied', (hd <> 0 or gd <> 0), 'winner', w,
                           'delta', case when my = 1 then hd else gd end);
end $$;

revoke all on function public.bw_report_result(text, integer) from public;
grant execute on function public.bw_report_result(text, integer) to authenticated;

-- close the old hole: nobody can call apply_skill_delta from a browser any more
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'apply_skill_delta'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;
end $$;
