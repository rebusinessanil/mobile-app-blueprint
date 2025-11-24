-- Fix trigger functions to use correct Motivational_image_url field

-- Drop functions with CASCADE to remove dependent triggers
DROP FUNCTION IF EXISTS create_template_for_new_motivational_banner() CASCADE;
DROP FUNCTION IF EXISTS sync_template_on_motivational_banner_update() CASCADE;

-- Recreate function with correct field reference
CREATE OR REPLACE FUNCTION public.create_template_for_new_motivational_banner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      NEW."Motivational_image_url",
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate sync function with correct field reference
CREATE OR REPLACE FUNCTION public.sync_template_on_motivational_banner_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' motivational banner',
    cover_thumbnail_url = NEW."Motivational_image_url",
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE motivational_banner_id = NEW.id;
  RETURN NEW;
END;
$function$;

-- Recreate triggers
CREATE TRIGGER create_template_for_new_motivational_banner
  AFTER INSERT ON "Motivational Banner"
  FOR EACH ROW
  EXECUTE FUNCTION create_template_for_new_motivational_banner();

CREATE TRIGGER sync_template_on_motivational_banner_update
  AFTER UPDATE ON "Motivational Banner"
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_on_motivational_banner_update();