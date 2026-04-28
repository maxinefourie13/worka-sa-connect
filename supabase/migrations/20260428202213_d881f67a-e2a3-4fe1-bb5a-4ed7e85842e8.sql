-- Drop existing unique constraint on email alone (if present), then add composite uniqueness
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.early_access_signups'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.early_access_signups DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

-- Also drop any unique indexes on email alone
DROP INDEX IF EXISTS public.early_access_signups_email_key;
DROP INDEX IF EXISTS public.early_access_signups_email_idx;

-- Add composite uniqueness on (email, role)
ALTER TABLE public.early_access_signups
  ADD CONSTRAINT early_access_signups_email_role_key UNIQUE (email, role);
