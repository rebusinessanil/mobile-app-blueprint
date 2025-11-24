-- Create trip_achievements table to store user banner creations for bonanza trips
CREATE TABLE IF NOT EXISTS public.trip_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.bonanza_trips(id) ON DELETE CASCADE,
  banner_id UUID REFERENCES public.banners(id) ON DELETE SET NULL,
  achievement_photo TEXT,
  team_city TEXT,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own trip achievements"
  ON public.trip_achievements
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own trip achievements"
  ON public.trip_achievements
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own trip achievements"
  ON public.trip_achievements
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own trip achievements"
  ON public.trip_achievements
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all achievements
CREATE POLICY "Admins can view all trip achievements"
  ON public.trip_achievements
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_trip_achievements_user_id ON public.trip_achievements(user_id);
CREATE INDEX idx_trip_achievements_trip_id ON public.trip_achievements(trip_id);
CREATE INDEX idx_trip_achievements_created_at ON public.trip_achievements(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_trip_achievements_updated_at
  BEFORE UPDATE ON public.trip_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();