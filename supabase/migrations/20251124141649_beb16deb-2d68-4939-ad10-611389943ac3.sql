-- Create anniversary table (similar to Birthday structure)
CREATE TABLE IF NOT EXISTS public.anniversary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_title TEXT,
  anniversary_image_url TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.template_categories(id),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anniversary ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view active anniversaries"
  ON public.anniversary
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage anniversaries"
  ON public.anniversary
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add anniversary_id column to templates table
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS anniversary_id UUID REFERENCES public.anniversary(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_anniversary_id ON public.templates(anniversary_id);

-- Create trigger function to automatically create template for new anniversary
CREATE OR REPLACE FUNCTION public.create_template_for_new_anniversary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create template if anniversary has a category_id
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
      NEW.anniversary_image_url,
      NEW.is_active,
      NEW.display_order
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new anniversaries
DROP TRIGGER IF EXISTS trigger_create_template_for_new_anniversary ON public.anniversary;
CREATE TRIGGER trigger_create_template_for_new_anniversary
  AFTER INSERT ON public.anniversary
  FOR EACH ROW
  EXECUTE FUNCTION create_template_for_new_anniversary();

-- Create trigger function to sync template when anniversary is updated
CREATE OR REPLACE FUNCTION public.sync_template_on_anniversary_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE templates
  SET 
    name = NEW.title,
    description = 'Template for ' || NEW.title || ' anniversary',
    cover_thumbnail_url = NEW.anniversary_image_url,
    is_active = NEW.is_active,
    display_order = NEW.display_order,
    category_id = NEW.category_id,
    updated_at = now()
  WHERE anniversary_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for anniversary updates
DROP TRIGGER IF EXISTS trigger_sync_template_on_anniversary_update ON public.anniversary;
CREATE TRIGGER trigger_sync_template_on_anniversary_update
  AFTER UPDATE ON public.anniversary
  FOR EACH ROW
  EXECUTE FUNCTION sync_template_on_anniversary_update();

-- Create templates for existing anniversaries that don't have one
INSERT INTO templates (id, category_id, anniversary_id, name, description, cover_thumbnail_url, is_active, display_order)
SELECT 
  gen_random_uuid(),
  a.category_id,
  a.id,
  a.title,
  'Template for ' || a.title || ' anniversary',
  a.anniversary_image_url,
  a.is_active,
  a.display_order
FROM anniversary a
WHERE a.category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM templates t WHERE t.anniversary_id = a.id
  );