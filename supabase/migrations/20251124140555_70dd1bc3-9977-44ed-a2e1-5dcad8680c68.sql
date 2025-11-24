-- Fix the sync_template_on_birthday_update function to use correct column name
DROP TRIGGER IF EXISTS trigger_sync_template_on_birthday_update ON "Birthday";
DROP FUNCTION IF EXISTS sync_template_on_birthday_update();

CREATE OR REPLACE FUNCTION public.sync_template_on_birthday_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' birthday',
    cover_thumbnail_url = NEW."Birthday_image_url",
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE birthday_id = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_sync_template_on_birthday_update
  AFTER UPDATE ON "Birthday"
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_on_birthday_update();