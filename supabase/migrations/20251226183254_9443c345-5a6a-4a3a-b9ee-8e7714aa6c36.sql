-- Add story_status column to stories_generated table
-- false = Upcoming (visible, yellow dot, no download/share)
-- true = Active (visible, green dot, download/share enabled)
-- null = Deactivated/Expired (completely hidden)

ALTER TABLE public.stories_generated 
ADD COLUMN IF NOT EXISTS story_status BOOLEAN DEFAULT NULL;

-- Migrate existing data based on current status
UPDATE public.stories_generated
SET story_status = CASE
  WHEN status = 'preview_only' AND expires_at > NOW() THEN false  -- Upcoming
  WHEN status = 'active' AND expires_at > NOW() THEN true         -- Active
  ELSE NULL                                                        -- Expired/Deactivated
END;

-- Add story_status to stories_events table for direct event management
ALTER TABLE public.stories_events
ADD COLUMN IF NOT EXISTS story_status BOOLEAN DEFAULT NULL;

-- Set story_status based on event_date for existing events
UPDATE public.stories_events
SET story_status = CASE
  WHEN is_active = false THEN NULL                                 -- Deactivated
  WHEN event_date > CURRENT_DATE THEN false                        -- Upcoming
  WHEN event_date = CURRENT_DATE THEN true                         -- Active today
  ELSE NULL                                                        -- Past/Expired
END;

-- Add story_status to stories_festivals table
ALTER TABLE public.stories_festivals
ADD COLUMN IF NOT EXISTS story_status BOOLEAN DEFAULT NULL;

-- Set story_status based on festival_date for existing festivals
UPDATE public.stories_festivals
SET story_status = CASE
  WHEN is_active = false THEN NULL                                 -- Deactivated
  WHEN festival_date > CURRENT_DATE THEN false                     -- Upcoming
  WHEN festival_date = CURRENT_DATE THEN true                      -- Active today
  ELSE NULL                                                        -- Past/Expired
END;

-- Create function to auto-update story_status based on date
CREATE OR REPLACE FUNCTION public.update_story_status_by_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update if is_active is true (not manually deactivated)
  IF TG_TABLE_NAME = 'stories_events' THEN
    IF NEW.is_active = false THEN
      NEW.story_status := NULL;
    ELSIF NEW.event_date > CURRENT_DATE THEN
      NEW.story_status := false;  -- Upcoming
    ELSIF NEW.event_date = CURRENT_DATE THEN
      NEW.story_status := true;   -- Active
    ELSE
      NEW.story_status := NULL;   -- Expired
    END IF;
  ELSIF TG_TABLE_NAME = 'stories_festivals' THEN
    IF NEW.is_active = false THEN
      NEW.story_status := NULL;
    ELSIF NEW.festival_date > CURRENT_DATE THEN
      NEW.story_status := false;  -- Upcoming
    ELSIF NEW.festival_date = CURRENT_DATE THEN
      NEW.story_status := true;   -- Active
    ELSE
      NEW.story_status := NULL;   -- Expired
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create triggers for auto-updating story_status
DROP TRIGGER IF EXISTS trigger_update_stories_events_status ON public.stories_events;
CREATE TRIGGER trigger_update_stories_events_status
  BEFORE INSERT OR UPDATE ON public.stories_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_status_by_date();

DROP TRIGGER IF EXISTS trigger_update_stories_festivals_status ON public.stories_festivals;
CREATE TRIGGER trigger_update_stories_festivals_status
  BEFORE INSERT OR UPDATE ON public.stories_festivals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_status_by_date();

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_stories_generated_story_status ON public.stories_generated(story_status) WHERE story_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_events_story_status ON public.stories_events(story_status) WHERE story_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_festivals_story_status ON public.stories_festivals(story_status) WHERE story_status IS NOT NULL;