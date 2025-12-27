
-- Schedule auto-story-generator to run daily at midnight IST (18:30 UTC)
-- This cron job will automatically update story statuses based on dates
SELECT cron.schedule(
  'auto-story-generator-midnight-ist',
  '30 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gjlrxikynlbpsvrpwebp.supabase.co/functions/v1/auto-story-generator',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHJ4aWt5bmxicHN2cnB3ZWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDYwMDYsImV4cCI6MjA3ODc4MjAwNn0.epDyoL8j-oMVZacwRV22SBwTGhLp9bWxGvhBIcOSQhg"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) AS request_id;
  $$
);
