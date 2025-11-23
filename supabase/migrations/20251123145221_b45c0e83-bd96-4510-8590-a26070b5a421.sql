-- Add category-specific upline management to user_banner_settings
-- This allows different upline configurations per banner category

-- Create a new table for category-specific banner settings
CREATE TABLE IF NOT EXISTS public.category_banner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_slug TEXT NOT NULL,
  upline_avatars JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_slug)
);

-- Enable RLS
ALTER TABLE public.category_banner_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category_banner_settings
CREATE POLICY "Users can view their own category settings"
  ON public.category_banner_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own category settings"
  ON public.category_banner_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own category settings"
  ON public.category_banner_settings
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can manage all category settings
CREATE POLICY "Admins can manage all category settings"
  ON public.category_banner_settings
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_category_banner_settings_updated_at
  BEFORE UPDATE ON public.category_banner_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.category_banner_settings;