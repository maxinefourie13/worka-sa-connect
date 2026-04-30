DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'locked' AND enumtypid = 'sjoh_tier'::regtype) THEN
    ALTER TYPE public.sjoh_tier ADD VALUE 'locked';
  END IF;
END $$;