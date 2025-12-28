-- Create/Replace the IST-based story status update function
CREATE OR REPLACE FUNCTION public.update_story_status_ist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ist_today date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
BEGIN
  -- Update stories_events: EXPIRE old events
  UPDATE stories_events
  SET story_status = NULL, is_active = false
  WHERE event_date < ist_today
    AND story_status IS NOT NULL;

  -- Update stories_events: GO LIVE for today's events
  UPDATE stories_events
  SET story_status = true, is_active = true
  WHERE event_date = ist_today
    AND (story_status IS NULL OR story_status = false);

  -- Update stories_events: UPCOMING for future events
  UPDATE stories_events
  SET story_status = false, is_active = true
  WHERE event_date > ist_today
    AND story_status IS DISTINCT FROM false;

  -- Update stories_festivals: EXPIRE old festivals
  UPDATE stories_festivals
  SET story_status = NULL, is_active = false
  WHERE festival_date < ist_today
    AND story_status IS NOT NULL;

  -- Update stories_festivals: GO LIVE for today's festivals
  UPDATE stories_festivals
  SET story_status = true, is_active = true
  WHERE festival_date = ist_today
    AND (story_status IS NULL OR story_status = false);

  -- Update stories_festivals: UPCOMING for future festivals
  UPDATE stories_festivals
  SET story_status = false, is_active = true
  WHERE festival_date > ist_today
    AND story_status IS DISTINCT FROM false;

  -- Update stories_generated: EXPIRE old stories
  UPDATE stories_generated
  SET story_status = NULL, status = 'expired'
  WHERE event_date < ist_today
    AND story_status IS NOT NULL;

  -- Update stories_generated: GO LIVE for today's stories
  UPDATE stories_generated
  SET story_status = true, status = 'active'
  WHERE event_date = ist_today
    AND (story_status IS NULL OR story_status = false);

  -- Update stories_generated: UPCOMING for future stories
  UPDATE stories_generated
  SET story_status = false, status = 'preview_only'
  WHERE event_date > ist_today
    AND story_status IS DISTINCT FROM false;

  -- Log the update with IST timestamp
  RAISE NOTICE 'Story status update completed at IST: %', (now() AT TIME ZONE 'Asia/Kolkata')::timestamp;
END;
$$;

-- Create a function to get current IST time (for display purposes)
CREATE OR REPLACE FUNCTION public.get_ist_now()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
AS $$
  SELECT now() AT TIME ZONE 'Asia/Kolkata';
$$;

-- Create a function to get IST date
CREATE OR REPLACE FUNCTION public.get_ist_date()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE stories_events REPLICA IDENTITY FULL;
ALTER TABLE stories_festivals REPLICA IDENTITY FULL;
ALTER TABLE stories_generated REPLICA IDENTITY FULL;

-- Add tables to realtime publication (if not already added)
DO $$
BEGIN
  -- Check and add stories_events
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_events;
  END IF;
  
  -- Check and add stories_festivals
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_festivals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_festivals;
  END IF;
  
  -- Check and add stories_generated
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories_generated'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories_generated;
  END IF;
END $$;