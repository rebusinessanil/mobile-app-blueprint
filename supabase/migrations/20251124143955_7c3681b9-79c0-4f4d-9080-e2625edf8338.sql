-- Add motivational_banner_id column to templates table
ALTER TABLE templates ADD COLUMN motivational_banner_id uuid REFERENCES "Motivational Banner"(id) ON DELETE CASCADE;

-- Create index for motivational_banner_id
CREATE INDEX idx_templates_motivational_banner_id ON templates(motivational_banner_id);

-- Ensure RLS policies exist on Motivational Banner table
DROP POLICY IF EXISTS "Anyone can view active motivational banners" ON "Motivational Banner";
DROP POLICY IF EXISTS "Only admins can manage motivational banners" ON "Motivational Banner";

CREATE POLICY "Anyone can view active motivational banners" 
ON "Motivational Banner" 
FOR SELECT 
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage motivational banners" 
ON "Motivational Banner" 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger function to auto-create template for new motivational banner
CREATE OR REPLACE FUNCTION create_template_for_new_motivational_banner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    INSERT INTO templates (
      id,
      category_id,
      motivational_banner_id,
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
      'Template for ' || NEW.title || ' motivational banner',
      NEW."Anniversary_image_url",
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function to sync template on motivational banner update
CREATE OR REPLACE FUNCTION sync_template_on_motivational_banner_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' motivational banner',
    cover_thumbnail_url = NEW."Anniversary_image_url",
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE motivational_banner_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_create_template_for_motivational_banner ON "Motivational Banner";
DROP TRIGGER IF EXISTS trigger_sync_template_on_motivational_banner_update ON "Motivational Banner";

CREATE TRIGGER trigger_create_template_for_motivational_banner
AFTER INSERT ON "Motivational Banner"
FOR EACH ROW
EXECUTE FUNCTION create_template_for_new_motivational_banner();

CREATE TRIGGER trigger_sync_template_on_motivational_banner_update
AFTER UPDATE ON "Motivational Banner"
FOR EACH ROW
EXECUTE FUNCTION sync_template_on_motivational_banner_update();

-- Create templates for existing motivational banners that don't have one
INSERT INTO templates (
  id,
  category_id,
  motivational_banner_id,
  name,
  description,
  cover_thumbnail_url,
  is_active,
  display_order
)
SELECT
  gen_random_uuid(),
  mb.category_id,
  mb.id,
  mb.title,
  'Template for ' || mb.title || ' motivational banner',
  mb."Anniversary_image_url",
  mb.is_active,
  mb.display_order
FROM "Motivational Banner" mb
WHERE mb.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM templates t 
    WHERE t.motivational_banner_id = mb.id
  );