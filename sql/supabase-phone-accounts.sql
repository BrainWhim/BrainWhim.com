-- BrainWhim, Nov 13 2026: phone accounts were marked as guests ("Visitor").
-- The live sign-up function set is_guest = (new.email is null), left over from the
-- old anonymous-guest days, so every phone account became a guest. Now only a real
-- anonymous session is a guest. Run the whole file once in Supabase -> SQL Editor.

-- 1. The sign-up function: same as before, except is_guest and the fallback name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uname text;
begin
  uname := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9_]+', '', 'g'
  ));
  if uname is null or uname = '' or uname = 'player' then
    -- was 'guest…', which the site reads as a Visitor
    uname := 'player' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, display_name, username, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', uname),
    uname,
    coalesce(new.is_anonymous, false)
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        username = coalesce(public.profiles.username, excluded.username);
  return new;
end;
$function$;

-- 2. Fix existing accounts: real (email or phone) accounts are never guests.
update public.profiles p
   set is_guest = false
  from auth.users u
 where u.id = p.id
   and not coalesce(u.is_anonymous, false)
   and p.is_guest;

-- 3. Real accounts still named 'guest…' get a 'player…' name instead
--    (they can choose their own in the lobby).
update public.profiles p
   set username = 'player' || substr(replace(p.id::text, '-', ''), 1, 8),
       display_name = case when p.display_name like 'guest%'
                           then 'player' || substr(replace(p.id::text, '-', ''), 1, 8)
                           else p.display_name end
  from auth.users u
 where u.id = p.id
   and not coalesce(u.is_anonymous, false)
   and p.username like 'guest%';

-- 4. Check: should list no real accounts.
select p.username, p.is_guest, u.phone, u.email
  from public.profiles p join auth.users u on u.id = p.id
 where p.is_guest or p.username like 'guest%';
