-- Drop existing template_backgrounds table to recreate with proper structure
DROP TABLE IF EXISTS public.template_backgrounds CASCADE;

-- Recreate template_backgrounds with proper foreign key to templates
CREATE TABLE public.template_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  background_image_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_backgrounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active template backgrounds"
  ON public.template_backgrounds
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage template backgrounds"
  ON public.template_backgrounds
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_template_backgrounds_updated_at
  BEFORE UPDATE ON public.template_backgrounds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_template_backgrounds_template_id ON public.template_backgrounds(template_id);
CREATE INDEX idx_template_backgrounds_active ON public.template_backgrounds(is_active) WHERE is_active = true;