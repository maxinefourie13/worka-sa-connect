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
    url := 'https://omhjcalrfhswjmanriqv.supabase.co/functions/v1/lifecycle-tick',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taGpjYWxyZmhzd2ptYW5yaXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDMxMjYsImV4cCI6MjA5NDYxOTEyNn0.j8LT6YA3Z7n0laL7TkcIe7VdlMnFYzZ1kW1u6duriIE", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taGpjYWxyZmhzd2ptYW5yaXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDMxMjYsImV4cCI6MjA5NDYxOTEyNn0.j8LT6YA3Z7n0laL7TkcIe7VdlMnFYzZ1kW1u6duriIE"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);