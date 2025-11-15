-- Create template categories table with dynamic covers
CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.template_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_thumbnail_url TEXT NOT NULL,
  gradient_colors TEXT[], -- Array of color codes for gradients
  required_fields JSONB DEFAULT '[]'::jsonb, -- Fields needed for banner creation
  layout_config JSONB DEFAULT '{}'::jsonb, -- Position/size data for overlay
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories table for category/template stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.template_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  type TEXT DEFAULT 'image', -- 'image', 'video', 'banner'
  content_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_categories
CREATE POLICY "Anyone can view active categories"
  ON public.template_categories FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage categories"
  ON public.template_categories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for templates
CREATE POLICY "Anyone can view active templates"
  ON public.templates FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage templates"
  ON public.templates FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for stories
CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage stories"
  ON public.stories FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_template_categories_updated_at
  BEFORE UPDATE ON public.template_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for template covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('template-covers', 'template-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for template-covers bucket
CREATE POLICY "Public can view template covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template-covers');

CREATE POLICY "Admins can upload template covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'template-covers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update template covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'template-covers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete template covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'template-covers' 
    AND public.is_admin(auth.uid())
  );

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.template_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

-- Insert default categories with placeholder covers
INSERT INTO public.template_categories (name, slug, description, icon, display_order) VALUES
  ('Rank Promotion', 'rank-promotion', 'Celebrate rank achievements', '🏆', 1),
  ('Bonanza Trips', 'bonanza-trips', 'Achievement trip banners', '✈️', 2),
  ('Birthday', 'birthday', 'Birthday celebration banners', '🎂', 3),
  ('Anniversary', 'anniversary', 'Anniversary banners', '💞', 4),
  ('New Joiner', 'new-joiner', 'Welcome new team members', '👋', 5),
  ('Income Banner', 'income-banner', 'Income achievement banners', '💰', 6),
  ('Awards', 'awards', 'Award and recognition banners', '🏅', 7),
  ('Events', 'events', 'Event and meeting banners', '📅', 8);