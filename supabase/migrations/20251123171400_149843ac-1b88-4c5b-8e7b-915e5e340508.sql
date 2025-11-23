-- Create bonanza_trips table
CREATE TABLE IF NOT EXISTS public.bonanza_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_title TEXT,
  trip_image_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonanza_trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active bonanza trips"
  ON public.bonanza_trips
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage bonanza trips"
  ON public.bonanza_trips
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_bonanza_trips_updated_at
  BEFORE UPDATE ON public.bonanza_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default bonanza trips
INSERT INTO public.bonanza_trips (title, short_title, trip_image_url, description, display_order, is_active) VALUES
  ('Jaisalmer Trip', 'Jaisalmer', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/bonanza-jaisalmer.jpg', 'Desert adventure in Jaisalmer', 1, true),
  ('Vietnam Trip', 'Vietnam', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/bonanza-vietnam.jpg', 'Explore the beauty of Vietnam', 2, true),
  ('Dubai Trip', 'Dubai', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/bonanza-dubai.jpg', 'Luxury experience in Dubai', 3, true),
  ('Thailand Trip', 'Thailand', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/bonanza-thailand.jpg', 'Tropical paradise in Thailand', 4, true),
  ('Singapore Trip', 'Singapore', 'https://gjlrxikynlbpsvrpwebp.supabase.co/storage/v1/object/public/template-covers/bonanza-singapore.jpg', 'Modern marvels of Singapore', 5, true);