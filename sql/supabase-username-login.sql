-- BrainWhim, Nov 13 2026: username login for every account (email or phone),
-- without the browser ever seeing an email or phone number.
-- Used ONLY by the bw-login Edge Function (service role). Browsers can't call it.
create or replace function public.bw_login_ident(n text)
returns table (email text, phone text)
language sql security definer stable
set search_path = public, auth
as $$
  select u.email::text, u.phone::text
    from public.profiles p join auth.users u on u.id = p.id
   where lower(p.username) = lower(trim(n))
     and not coalesce(u.is_anonymous, false)
   limit 1;
$$;
revoke all on function public.bw_login_ident(text) from public, anon, authenticated;
grant execute on function public.bw_login_ident(text) to service_role;

-- LATER (only after username login through bw-login is tested and working):
-- stop browsers looking up an email from a username.
-- revoke execute on function public.bw_login_email(text) from anon, authenticated;
