-- BrainWhim Play — usernames, invites, open tables
-- SQL Editor → New query → paste all → Run

alter table public.profiles
  add column if not exists username text;

update public.profiles
  set username = lower(regexp_replace(coalesce(display_name, id::text), '[^a-zA-Z0-9_]+', '', 'g'))
  where username is null or username = '';

create unique index if not exists profiles_username_uniq
  on public.profiles (lower(username));

alter table public.rooms
  add column if not exists kind text not null default 'open';

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  to_id uuid not null references auth.users(id) on delete cascade,
  from_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'invite',
  game text not null default 'chess',
  room_code text,
  body text,
  status text not null default 'pending',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notices_to_idx on public.notices (to_id, created_at desc);
create index if not exists rooms_open_idx on public.rooms (game, status, kind);

alter table public.notices enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "notices_select_mine" on public.notices;
create policy "notices_select_mine"
  on public.notices for select
  to authenticated
  using (auth.uid() = to_id or auth.uid() = from_id);

drop policy if exists "notices_insert_from" on public.notices;
create policy "notices_insert_from"
  on public.notices for insert
  to authenticated
  with check (auth.uid() = from_id);

drop policy if exists "notices_update_mine" on public.notices;
create policy "notices_update_mine"
  on public.notices for update
  to authenticated
  using (auth.uid() = to_id or auth.uid() = from_id)
  with check (auth.uid() = to_id or auth.uid() = from_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9_]+', '', 'g'
  ));
  if uname is null or uname = '' then uname := 'player'; end if;
  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', uname), uname)
  on conflict (id) do update
    set display_name = excluded.display_name,
        username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$$;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.notices to authenticated;
grant select, insert, update on table public.rooms to authenticated;

alter table public.notices replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.notices;
  exception when duplicate_object then
    null;
  end;
end $$;

notify pgrst, 'reload schema';
