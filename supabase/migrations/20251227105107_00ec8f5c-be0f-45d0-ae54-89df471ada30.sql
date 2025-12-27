-- =====================================================
-- STORIES DATE MANAGEMENT TRIGGER (IST Timezone)
-- =====================================================
-- This migration:
-- 1. Creates a trigger function for stories_events table
-- 2. Auto-calculates start_date, end_date, and story_status based on event_date
-- 3. Fixes existing rows with NULL start_date

-- Create or replace the trigger function for stories_events
CREATE OR REPLACE FUNCTION public.manage_stories_event_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date_ist DATE;
  event_start_timestamp TIMESTAMPTZ;
  event_end_timestamp TIMESTAMPTZ;
BEGIN
  -- Get current date in IST (Asia/Kolkata)
  current_date_ist := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- If event_date is set/changed, calculate dates
  IF NEW.event_date IS NOT NULL THEN
    -- Set start_date to IST midnight of event_date
    event_start_timestamp := (NEW.event_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
    NEW.start_date := NEW.event_date;
    
    -- Set end_date to start_date + 24 hours
    event_end_timestamp := event_start_timestamp + INTERVAL '1 day';
    NEW.end_date := (event_end_timestamp AT TIME ZONE 'Asia/Kolkata')::DATE;
    
    -- Calculate story_status based on event_date vs current IST date
    -- Future event (event_date > today): FALSE (Upcoming)
    -- Today's event (event_date = today): TRUE (Active/Live)
    -- Past event (event_date < today): NULL (Expired/Hidden)
    IF NEW.event_date > current_date_ist THEN
      NEW.story_status := FALSE;  -- Upcoming
    ELSIF NEW.event_date = current_date_ist THEN
      NEW.story_status := TRUE;   -- Active/Live
    ELSE
      NEW.story_status := NULL;   -- Expired
    END IF;
  END IF;

  -- Ensure is_active respects story_status (if manually deactivated, set story_status to NULL)
  IF NEW.is_active = FALSE THEN
    NEW.story_status := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_manage_stories_event_dates ON public.stories_events;

-- Create the trigger for BEFORE INSERT OR UPDATE
CREATE TRIGGER trigger_manage_stories_event_dates
  BEFORE INSERT OR UPDATE ON public.stories_events
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_stories_event_dates();

-- =====================================================
-- FIX EXISTING ROWS WITH NULL start_date
-- =====================================================
-- One-time update to fix existing rows where start_date is NULL but event_date exists
UPDATE public.stories_events
SET 
  start_date = event_date,
  end_date = event_date + INTERVAL '1 day',
  story_status = CASE
    WHEN is_active = FALSE THEN NULL
    WHEN event_date > (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE THEN FALSE
    WHEN event_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE THEN TRUE
    ELSE NULL
  END
WHERE start_date IS NULL AND event_date IS NOT NULL;

-- =====================================================
-- SAME TRIGGER FOR stories_festivals TABLE
-- =====================================================
CREATE OR REPLACE FUNCTION public.manage_stories_festival_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_date_ist DATE;
BEGIN
  -- Get current date in IST
  current_date_ist := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- Calculate story_status based on festival_date vs current IST date
  IF NEW.festival_date IS NOT NULL THEN
    IF NEW.festival_date > current_date_ist THEN
      NEW.story_status := FALSE;  -- Upcoming
    ELSIF NEW.festival_date = current_date_ist THEN
      NEW.story_status := TRUE;   -- Active/Live
    ELSE
      NEW.story_status := NULL;   -- Expired
    END IF;
  END IF;

  -- If manually deactivated, set story_status to NULL
  IF NEW.is_active = FALSE THEN
    NEW.story_status := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_manage_stories_festival_dates ON public.stories_festivals;

-- Create the trigger
CREATE TRIGGER trigger_manage_stories_festival_dates
  BEFORE INSERT OR UPDATE ON public.stories_festivals
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_stories_festival_dates();

-- Fix existing festivals
UPDATE public.stories_festivals
SET story_status = CASE
    WHEN is_active = FALSE THEN NULL
    WHEN festival_date > (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE THEN FALSE
    WHEN festival_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE THEN TRUE
    ELSE NULL
  END
WHERE story_status IS NULL AND festival_date IS NOT NULL;