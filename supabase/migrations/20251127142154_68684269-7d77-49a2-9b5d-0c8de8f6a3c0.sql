-- Add stories_events_id column to templates table
ALTER TABLE public.templates
ADD COLUMN stories_events_id uuid REFERENCES public.stories_events(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_templates_stories_events_id ON public.templates(stories_events_id);

-- Function to auto-create template when new stories_event is added
CREATE OR REPLACE FUNCTION public.create_template_for_new_stories_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create template for the new stories_event
  INSERT INTO templates (
    id,
    category_id,
    stories_events_id,
    name,
    description,
    cover_thumbnail_url,
    is_active,
    display_order
  )
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM template_categories WHERE slug = 'stories' LIMIT 1),
    NEW.id,
    NEW.event_type || ' - ' || NEW.person_name,
    'Template for ' || NEW.event_type || ' event: ' || NEW.person_name,
    NEW.poster_url,
    true,
    0
  );
  RETURN NEW;
END;
$$;

-- Function to sync template when stories_event is updated
CREATE OR REPLACE FUNCTION public.sync_template_on_stories_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.event_type || ' - ' || NEW.person_name,
    description = 'Template for ' || NEW.event_type || ' event: ' || NEW.person_name,
    cover_thumbnail_url = NEW.poster_url,
    updated_at = now()
  WHERE stories_events_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create triggers on stories_events table
CREATE TRIGGER trigger_create_template_for_new_stories_event
AFTER INSERT ON public.stories_events
FOR EACH ROW
EXECUTE FUNCTION public.create_template_for_new_stories_event();

CREATE TRIGGER trigger_sync_template_on_stories_event_update
AFTER UPDATE ON public.stories_events
FOR EACH ROW
EXECUTE FUNCTION public.sync_template_on_stories_event_update();

-- Add comment for documentation
COMMENT ON COLUMN public.templates.stories_events_id IS 'Links template to a specific stories_event (birthday, anniversary, etc.) - ensures proper isolation by category';