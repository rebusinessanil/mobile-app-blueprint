-- Add trip_id column to templates table to link templates with bonanza trips
ALTER TABLE templates
ADD COLUMN trip_id uuid REFERENCES bonanza_trips(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_templates_trip_id ON templates(trip_id);

-- Create trigger function to auto-create template for new bonanza trips
CREATE OR REPLACE FUNCTION public.create_template_for_new_trip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only create template if trip has a category_id
  IF NEW.category_id IS NOT NULL THEN
    INSERT INTO templates (
      id,
      category_id,
      trip_id,
      name,
      description,
      cover_thumbnail_url,
      is_active,
      display_order
    )
    VALUES (
      gen_random_uuid(),
      NEW.category_id,
      NEW.id,
      NEW.title,
      'Template for ' || NEW.title || ' trip',
      NEW.trip_image_url,
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create templates when new trips are added
CREATE TRIGGER trigger_create_template_for_new_trip
AFTER INSERT ON bonanza_trips
FOR EACH ROW
EXECUTE FUNCTION create_template_for_new_trip();

-- Create trigger function to sync template when trip is updated
CREATE OR REPLACE FUNCTION public.sync_template_on_trip_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' trip',
    cover_thumbnail_url = NEW.trip_image_url,
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE trip_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to sync templates when trips are updated
CREATE TRIGGER trigger_sync_template_on_trip_update
AFTER UPDATE ON bonanza_trips
FOR EACH ROW
EXECUTE FUNCTION sync_template_on_trip_update();

-- Create templates for existing bonanza trips that don't have templates yet
INSERT INTO templates (
  id,
  category_id,
  trip_id,
  name,
  description,
  cover_thumbnail_url,
  is_active,
  display_order
)
SELECT 
  gen_random_uuid(),
  bt.category_id,
  bt.id,
  bt.title,
  'Template for ' || bt.title || ' trip',
  bt.trip_image_url,
  bt.is_active,
  bt.display_order
FROM bonanza_trips bt
WHERE bt.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM templates t WHERE t.trip_id = bt.id
  );