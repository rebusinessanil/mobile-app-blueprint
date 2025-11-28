-- Add new fields to stories_events table for unified stories system
ALTER TABLE public.stories_events
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS story_type text CHECK (story_type IN ('festival', 'category', 'event', 'offer')),
ADD COLUMN IF NOT EXISTS festival_id uuid REFERENCES public.stories_festivals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.template_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS created_by uuid;

-- Update existing records to have default values
UPDATE public.stories_events
SET 
  title = COALESCE(title, event_type || ' - ' || person_name),
  image_url = COALESCE(image_url, poster_url),
  story_type = COALESCE(story_type, 'event'),
  is_active = COALESCE(is_active, true),
  priority = COALESCE(priority, 0),
  start_date = COALESCE(start_date, event_date),
  end_date = COALESCE(end_date, event_date + INTERVAL '7 days')
WHERE title IS NULL OR image_url IS NULL OR story_type IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_stories_events_active_priority 
ON public.stories_events(is_active, priority DESC, start_date DESC)
WHERE is_active = true;