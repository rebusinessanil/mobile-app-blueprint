-- Create table for banner carousel images
CREATE TABLE public.banner_carousel_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_carousel_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view active carousel images
CREATE POLICY "Anyone can view active carousel images"
ON public.banner_carousel_images
FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

-- Only admins can manage carousel images
CREATE POLICY "Only admins can manage carousel images"
ON public.banner_carousel_images
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_banner_carousel_images_updated_at
BEFORE UPDATE ON public.banner_carousel_images
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();