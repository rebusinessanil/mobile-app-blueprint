-- Add festival_id column to templates table
ALTER TABLE templates ADD COLUMN festival_id uuid REFERENCES stories_festivals(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_templates_festival_id ON templates(festival_id);

-- Create trigger function to auto-create template when new festival is added
CREATE OR REPLACE FUNCTION create_template_for_new_festival()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    INSERT INTO templates (
      id,
      category_id,
      festival_id,
      name,
      description,
      cover_thumbnail_url,
      is_active,
      display_order
    )
    VALUES (
      gen_random_uuid(),
      (SELECT id FROM template_categories WHERE slug = 'festival' LIMIT 1),
      NEW.id,
      NEW.festival_name,
      'Template for ' || NEW.festival_name || ' festival',
      NEW.poster_url,
      NEW.is_active,
      0
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to execute function on festival insert
CREATE TRIGGER trigger_create_template_for_new_festival
AFTER INSERT ON stories_festivals
FOR EACH ROW
EXECUTE FUNCTION create_template_for_new_festival();

-- Create trigger function to sync template when festival is updated
CREATE OR REPLACE FUNCTION sync_template_on_festival_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.festival_name,
    description = 'Template for ' || NEW.festival_name || ' festival',
    cover_thumbnail_url = NEW.poster_url,
    is_active = NEW.is_active,
    updated_at = now()
  WHERE festival_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger to execute function on festival update
CREATE TRIGGER trigger_sync_template_on_festival_update
AFTER UPDATE ON stories_festivals
FOR EACH ROW
WHEN (OLD.festival_name IS DISTINCT FROM NEW.festival_name 
      OR OLD.poster_url IS DISTINCT FROM NEW.poster_url 
      OR OLD.is_active IS DISTINCT FROM NEW.is_active)
EXECUTE FUNCTION sync_template_on_festival_update();