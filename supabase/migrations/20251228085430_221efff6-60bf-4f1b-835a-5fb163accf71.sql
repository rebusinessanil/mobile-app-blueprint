-- Schedule the cron job to run at 12:00 AM IST (18:30 UTC previous day)
-- First check if job exists and drop it
SELECT cron.unschedule('update-story-status-ist-midnight') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-story-status-ist-midnight');

-- Schedule new cron job
SELECT cron.schedule(
  'update-story-status-ist-midnight',
  '30 18 * * *',
  $$SELECT public.update_story_status_ist();$$
);