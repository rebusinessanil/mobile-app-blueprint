-- Create sticker categories table
CREATE TABLE IF NOT EXISTS public.sticker_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stickers table
CREATE TABLE IF NOT EXISTS public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.sticker_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create banner_stickers junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.banner_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID REFERENCES public.banners(id) ON DELETE CASCADE,
  sticker_id UUID REFERENCES public.stickers(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(banner_id, sticker_id)
);

-- Create user_roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.sticker_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role = 'admin'
  );
$$;

-- RLS Policies for sticker_categories
CREATE POLICY "Anyone can view active categories"
  ON public.sticker_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.sticker_categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON public.sticker_categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON public.sticker_categories FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for stickers
CREATE POLICY "Anyone can view active stickers"
  ON public.stickers FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert stickers"
  ON public.stickers FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update stickers"
  ON public.stickers FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete stickers"
  ON public.stickers FOR DELETE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for banner_stickers
CREATE POLICY "Users can view their banner stickers"
  ON public.banner_stickers FOR SELECT
  USING (banner_id IN (
    SELECT id FROM public.banners 
    WHERE user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id)
  ));

CREATE POLICY "Users can manage their banner stickers"
  ON public.banner_stickers FOR ALL
  USING (banner_id IN (
    SELECT id FROM public.banners 
    WHERE user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id)
  ))
  WITH CHECK (banner_id IN (
    SELECT id FROM public.banners 
    WHERE user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id)
  ));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for stickers updated_at
CREATE TRIGGER update_stickers_updated_at
  BEFORE UPDATE ON public.stickers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.sticker_categories (name, description, display_order) VALUES
  ('Trips', 'Achievement trip stickers', 1),
  ('Awards', 'Award and recognition stickers', 2),
  ('Trophies', 'Trophy and milestone stickers', 3),
  ('Events', 'Special event stickers', 4);

-- Create storage bucket for stickers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stickers', 'stickers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stickers bucket
CREATE POLICY "Public can view stickers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stickers');

CREATE POLICY "Admins can upload stickers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stickers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update stickers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'stickers' 
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete stickers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stickers' 
    AND public.is_admin(auth.uid())
  );