-- Drop the duplicate anniversary table and use the existing Anniversary table
DROP TABLE IF EXISTS anniversary CASCADE;

-- Ensure Anniversary table has proper structure and constraints
ALTER TABLE "Anniversary" 
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES template_categories(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_anniversary_category_id ON "Anniversary"(category_id);
CREATE INDEX IF NOT EXISTS idx_anniversary_is_active ON "Anniversary"(is_active);

-- Update templates table to reference Anniversary (capital A)
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_anniversary_id_fkey;
ALTER TABLE templates 
  ADD CONSTRAINT templates_anniversary_id_fkey 
  FOREIGN KEY (anniversary_id) 
  REFERENCES "Anniversary"(id) 
  ON DELETE CASCADE;

-- Create trigger function for Anniversary template creation
CREATE OR REPLACE FUNCTION create_template_for_new_anniversary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    INSERT INTO templates (
      id,
      category_id,
      anniversary_id,
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
      'Template for ' || NEW.title || ' anniversary',
      NEW."Anniversary_image_url",
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger function for Anniversary template sync
CREATE OR REPLACE FUNCTION sync_template_on_anniversary_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' anniversary',
    cover_thumbnail_url = NEW."Anniversary_image_url",
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE anniversary_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS create_anniversary_template_trigger ON "Anniversary";
CREATE TRIGGER create_anniversary_template_trigger
  AFTER INSERT ON "Anniversary"
  FOR EACH ROW
  EXECUTE FUNCTION create_template_for_new_anniversary();

DROP TRIGGER IF EXISTS sync_anniversary_template_trigger ON "Anniversary";
CREATE TRIGGER sync_anniversary_template_trigger
  AFTER UPDATE ON "Anniversary"
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_on_anniversary_update();

-- Ensure RLS policies exist on Anniversary table
ALTER TABLE "Anniversary" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active anniversaries" ON "Anniversary";
CREATE POLICY "Anyone can view active anniversaries"
  ON "Anniversary"
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can manage anniversaries" ON "Anniversary";
CREATE POLICY "Only admins can manage anniversaries"
  ON "Anniversary"
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));