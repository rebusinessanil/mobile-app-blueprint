-- Create storage bucket for template backgrounds
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-backgrounds', 'template-backgrounds', true);

-- Create template_backgrounds table to store background images for each template color
CREATE TABLE IF NOT EXISTS public.template_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_index INTEGER NOT NULL UNIQUE CHECK (template_index >= 0 AND template_index <= 15),
  background_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_backgrounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view template backgrounds"
  ON public.template_backgrounds
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage template backgrounds"
  ON public.template_backgrounds
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Storage policies for template-backgrounds bucket
CREATE POLICY "Anyone can view template background images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'template-backgrounds');

CREATE POLICY "Admins can upload template background images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'template-backgrounds' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update template background images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'template-backgrounds' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete template background images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'template-backgrounds' AND is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_template_backgrounds_updated_at
  BEFORE UPDATE ON public.template_backgrounds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();