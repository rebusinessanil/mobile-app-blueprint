-- Add start_date and end_date columns to stories_festivals if missing
ALTER TABLE public.stories_festivals 
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz;

-- Create trigger function for stories_festivals dates and status
CREATE OR REPLACE FUNCTION public.manage_stories_festival_dates()
RETURNS TRIGGER AS $$
DECLARE
  ist_now timestamptz;
  ist_midnight timestamptz;
BEGIN
  -- Get current IST time
  ist_now := NOW() AT TIME ZONE 'Asia/Kolkata';
  
  -- If festival_date is set, compute start_date and end_date
  IF NEW.festival_date IS NOT NULL THEN
    -- Set start_date to IST midnight of festival_date
    ist_midnight := (NEW.festival_date::date || ' 00:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata';
    NEW.start_date := ist_midnight;
    
    -- Set end_date to start_date + 24 hours
    NEW.end_date := NEW.start_date + INTERVAL '24 hours';
    
    -- Compute story_status based on IST date comparison
    IF NEW.festival_date > (ist_now::date) THEN
      -- Future: Upcoming
      NEW.story_status := FALSE;
    ELSIF NEW.festival_date = (ist_now::date) THEN
      -- Today: Active/Live
      NEW.story_status := TRUE;
    ELSE
      -- Past: Expired/Hidden
      NEW.story_status := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_manage_stories_festival_dates ON public.stories_festivals;
CREATE TRIGGER trigger_manage_stories_festival_dates
  BEFORE INSERT OR UPDATE ON public.stories_festivals
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_stories_festival_dates();

-- Backfill existing rows with NULL start_date using festival_date
UPDATE public.stories_festivals
SET 
  start_date = (festival_date::date || ' 00:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata',
  end_date = ((festival_date::date || ' 00:00:00')::timestamp AT TIME ZONE 'Asia/Kolkata') + INTERVAL '24 hours',
  story_status = CASE 
    WHEN festival_date > (NOW() AT TIME ZONE 'Asia/Kolkata')::date THEN FALSE
    WHEN festival_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date THEN TRUE
    ELSE NULL
  END
WHERE start_date IS NULL AND festival_date IS NOT NULL;