-- Insert templates for all existing ranks under Rank Promotion category
INSERT INTO templates (id, category_id, rank_id, name, description, cover_thumbnail_url, is_active, display_order)
SELECT 
  gen_random_uuid(),
  '52985289-a964-4ace-a5d6-538c96b95292'::uuid,
  id,
  name,
  'Template for ' || name || ' rank promotion',
  'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/rank-default.png',
  true,
  display_order
FROM ranks
WHERE NOT EXISTS (
  SELECT 1 FROM templates 
  WHERE templates.rank_id = ranks.id 
  AND templates.category_id = '52985289-a964-4ace-a5d6-538c96b95292'::uuid
);

-- Create function to auto-create template when a new rank is added
CREATE OR REPLACE FUNCTION public.create_template_for_new_rank()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO templates (id, category_id, rank_id, name, description, cover_thumbnail_url, is_active, display_order)
  VALUES (
    gen_random_uuid(),
    '52985289-a964-4ace-a5d6-538c96b95292'::uuid,
    NEW.id,
    NEW.name,
    'Template for ' || NEW.name || ' rank promotion',
    'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/rank-default.png',
    NEW.is_active,
    NEW.display_order
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create template when rank is inserted
DROP TRIGGER IF EXISTS trigger_create_template_for_rank ON ranks;
CREATE TRIGGER trigger_create_template_for_rank
  AFTER INSERT ON ranks
  FOR EACH ROW
  EXECUTE FUNCTION create_template_for_new_rank();

-- Create function to sync template name when rank name changes
CREATE OR REPLACE FUNCTION public.sync_template_name_on_rank_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.name,
    description = 'Template for ' || NEW.name || ' rank promotion',
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    updated_at = now()
  WHERE rank_id = NEW.id 
    AND category_id = '52985289-a964-4ace-a5d6-538c96b95292'::uuid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync template when rank is updated
DROP TRIGGER IF EXISTS trigger_sync_template_on_rank_update ON ranks;
CREATE TRIGGER trigger_sync_template_on_rank_update
  AFTER UPDATE ON ranks
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_name_on_rank_update();