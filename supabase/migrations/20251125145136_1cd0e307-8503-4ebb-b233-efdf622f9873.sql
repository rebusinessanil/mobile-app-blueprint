-- Create table for motivational banner profile picture defaults
CREATE TABLE IF NOT EXISTS public.motivational_profile_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motivational_banner_id uuid NOT NULL REFERENCES public."Motivational Banner"(id) ON DELETE CASCADE,
  profile_position_x numeric NOT NULL DEFAULT 0,
  profile_position_y numeric NOT NULL DEFAULT 0,
  profile_scale numeric NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(motivational_banner_id)
);

-- Enable RLS
ALTER TABLE public.motivational_profile_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view motivational profile defaults"
  ON public.motivational_profile_defaults
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage motivational profile defaults"
  ON public.motivational_profile_defaults
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add index for faster lookups
CREATE INDEX idx_motivational_profile_defaults_banner_id 
  ON public.motivational_profile_defaults(motivational_banner_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_motivational_profile_defaults_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_motivational_profile_defaults_timestamp
  BEFORE UPDATE ON public.motivational_profile_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_motivational_profile_defaults_updated_at();