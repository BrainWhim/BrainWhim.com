-- BrainWhim: PART 3, the lock-down.  Run ONLY after supabase-auth-setup.sql succeeded
-- and you've confirmed sign-in, Tables and the mailbox still work.
--
-- What it does to public.profiles:
--   * Browsers can no longer change member, skill_points, online_day or online_count.
--   * Browsers can no longer read anyone's email or phone.
--   * People can only create/edit their own row (username, display_name, last_seen).
-- Everything else (rooms, notices) is untouched.

alter table public.profiles enable row level security;

-- replace every existing profiles policy with a known, minimal set
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy bw_profiles_read   on public.profiles for select using (true);
create policy bw_profiles_insert on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy bw_profiles_update on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- column-level permissions: this is what actually blocks edits to points/membership
revoke select, insert, update, delete on public.profiles from anon, authenticated;

do $$
declare readable text; writable text;
begin
  select string_agg(quote_ident(column_name), ', ') into readable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name not in ('email', 'phone');

  select string_agg(quote_ident(column_name), ', ') into writable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name in ('username', 'display_name', 'last_seen', 'is_guest');

  execute format('grant select (%s) on public.profiles to anon, authenticated', readable);
  execute format('grant update (%s) on public.profiles to authenticated', writable);
  execute 'grant insert (id, username, display_name) on public.profiles to authenticated';
end $$;

-- old username->email function leaked emails to anyone; the new one replaces it
drop function if exists public.email_for_username(text);

-- UNDO, if something breaks (restores wide-open access):
--   grant select, insert, update on public.profiles to anon, authenticated;
