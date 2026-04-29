-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior version of the job before re-scheduling
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lifecycle-tick-daily') THEN
    PERFORM cron.unschedule('lifecycle-tick-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'lifecycle-tick-daily',
  '0 1 * * *',  -- 01:00 UTC daily (~03:00 SAST)
  $$
  SELECT net.http_post(
    url := 'https://zwgjbffesalpiaaycbac.supabase.co/functions/v1/lifecycle-tick',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3Z2piZmZlc2FscGlhYXljYmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODEwODMsImV4cCI6MjA5Mjg1NzA4M30.ZMTcCkb2Htl7vo4MtYYwmK99JpauL6ov20jfVDo1AFI"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);