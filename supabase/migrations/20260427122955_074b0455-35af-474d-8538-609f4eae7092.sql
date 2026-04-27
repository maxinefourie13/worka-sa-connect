-- Fix WARN 1: search_path on handle_updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix WARN 2-5: revoke EXECUTE on SECURITY DEFINER functions from public/anon/authenticated.
-- has_role is called only inside RLS policies (run as superuser-ish) so it doesn't need EXECUTE for clients.
-- handle_new_user is fired by an auth.users trigger only.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;