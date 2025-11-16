-- Create banner_defaults table for admin-managed defaults
CREATE TABLE IF NOT EXISTS public.banner_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upline_avatars JSONB DEFAULT '[]'::jsonb, -- Array of {name, avatar_url}
  logo_left TEXT,
  logo_right TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_banner_settings table for user overrides
CREATE TABLE IF NOT EXISTS public.user_banner_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  upline_avatars JSONB DEFAULT '[]'::jsonb, -- User's custom uplines (max 5)
  logo_left TEXT,
  logo_right TEXT,
  show_upline_names BOOLEAN DEFAULT true,
  show_contact_info BOOLEAN DEFAULT true,
  show_rank_badge BOOLEAN DEFAULT true,
  auto_share_to_feed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_banner_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banner_defaults (admin only can write, all can read)
CREATE POLICY "Anyone can view banner defaults"
  ON public.banner_defaults
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage banner defaults"
  ON public.banner_defaults
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for user_banner_settings
CREATE POLICY "Users can view their own banner settings"
  ON public.user_banner_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banner settings"
  ON public.user_banner_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banner settings"
  ON public.user_banner_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_banner_defaults_updated_at
  BEFORE UPDATE ON public.banner_defaults
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_banner_settings_updated_at
  BEFORE UPDATE ON public.user_banner_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert initial admin defaults (empty)
INSERT INTO public.banner_defaults (id, upline_avatars, logo_left, logo_right)
VALUES (gen_random_uuid(), '[]'::jsonb, NULL, NULL)
ON CONFLICT DO NOTHING;