-- New accounts should not receive an automatic 30-day trial anymore.
-- SORTED3 is now the only no-card launch trial path.

ALTER TABLE public.provider_balances
  ALTER COLUMN tier SET DEFAULT 'none'::public.sjoh_tier,
  ALTER COLUMN trial_ends_at DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.provider_balances (user_id, tier, trial_ends_at)
  VALUES (NEW.id, 'none'::public.sjoh_tier, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.handle_new_user()
  IS 'Creates baseline profile/role/provider records for new users without granting trial access. SORTED3 handles the launch trial.';
