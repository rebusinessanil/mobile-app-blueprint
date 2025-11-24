-- Create stories_events table for birthday/anniversary records
CREATE TABLE IF NOT EXISTS public.stories_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary')),
  event_date DATE NOT NULL,
  person_name TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories_festivals table for festival posters + date
CREATE TABLE IF NOT EXISTS public.stories_festivals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name TEXT NOT NULL,
  festival_date DATE NOT NULL,
  poster_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories_generated table for auto-created daily stories
CREATE TABLE IF NOT EXISTS public.stories_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('event', 'festival')),
  source_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'preview_only' CHECK (status IN ('preview_only', 'active', 'expired')),
  poster_url TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stories_settings table for global controls
CREATE TABLE IF NOT EXISTS public.stories_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stories_events_date ON public.stories_events(event_date);
CREATE INDEX IF NOT EXISTS idx_stories_festivals_date ON public.stories_festivals(festival_date);
CREATE INDEX IF NOT EXISTS idx_stories_generated_status ON public.stories_generated(status);
CREATE INDEX IF NOT EXISTS idx_stories_generated_expires ON public.stories_generated(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_generated_event_date ON public.stories_generated(event_date);

-- Enable RLS
ALTER TABLE public.stories_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories_festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories_events
CREATE POLICY "Anyone can view stories_events"
  ON public.stories_events FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage stories_events"
  ON public.stories_events FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for stories_festivals
CREATE POLICY "Anyone can view active stories_festivals"
  ON public.stories_festivals FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage stories_festivals"
  ON public.stories_festivals FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for stories_generated
CREATE POLICY "Anyone can view non-expired stories_generated"
  ON public.stories_generated FOR SELECT
  USING (expires_at > NOW() OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage stories_generated"
  ON public.stories_generated FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for stories_settings
CREATE POLICY "Anyone can view stories_settings"
  ON public.stories_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage stories_settings"
  ON public.stories_settings FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.stories_settings (setting_key, setting_value, description)
VALUES 
  ('auto_story_enabled', '{"enabled": true}'::jsonb, 'Enable/disable auto story generation'),
  ('preview_hours_before', '{"hours": 24}'::jsonb, 'Hours before event to show preview story'),
  ('story_duration_hours', '{"hours": 24}'::jsonb, 'Hours a story remains active after event date')
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_events_updated_at
  BEFORE UPDATE ON public.stories_events
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

CREATE TRIGGER stories_festivals_updated_at
  BEFORE UPDATE ON public.stories_festivals
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

CREATE TRIGGER stories_generated_updated_at
  BEFORE UPDATE ON public.stories_generated
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();

CREATE TRIGGER stories_settings_updated_at
  BEFORE UPDATE ON public.stories_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_updated_at();