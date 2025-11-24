-- Add birthday_id column to templates table
ALTER TABLE templates ADD COLUMN birthday_id uuid REFERENCES "Birthday"(id);

-- Create index for faster queries
CREATE INDEX idx_templates_birthday_id ON templates(birthday_id);

-- Function to auto-create template when new birthday is added
CREATE OR REPLACE FUNCTION create_template_for_new_birthday()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create template if birthday has a category_id
  IF NEW.category_id IS NOT NULL THEN
    INSERT INTO templates (
      id,
      category_id,
      birthday_id,
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
      'Template for ' || NEW.title || ' birthday',
      NEW.trip_image_url,
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create template for new birthday
CREATE TRIGGER trigger_create_template_for_new_birthday
AFTER INSERT ON "Birthday"
FOR EACH ROW
EXECUTE FUNCTION create_template_for_new_birthday();

-- Function to sync template when birthday is updated
CREATE OR REPLACE FUNCTION sync_template_on_birthday_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' birthday',
    cover_thumbnail_url = NEW.trip_image_url,
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE birthday_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to sync template on birthday update
CREATE TRIGGER trigger_sync_template_on_birthday_update
AFTER UPDATE ON "Birthday"
FOR EACH ROW
EXECUTE FUNCTION sync_template_on_birthday_update();

-- Create templates for existing birthdays that don't have one
INSERT INTO templates (id, category_id, birthday_id, name, description, cover_thumbnail_url, is_active, display_order)
SELECT 
  gen_random_uuid(),
  b.category_id,
  b.id,
  b.title,
  'Template for ' || b.title || ' birthday',
  b.trip_image_url,
  b.is_active,
  b.display_order
FROM "Birthday" b
WHERE b.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM templates t WHERE t.birthday_id = b.id
  );