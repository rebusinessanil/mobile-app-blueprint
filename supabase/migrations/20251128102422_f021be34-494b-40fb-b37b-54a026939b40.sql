-- Create story_background_slots table for managing 16 background slots per story
CREATE TABLE IF NOT EXISTS public.story_background_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 16),
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(story_id, slot_number)
);

-- Enable RLS
ALTER TABLE public.story_background_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active story background slots"
  ON public.story_background_slots
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage story background slots"
  ON public.story_background_slots
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_story_background_slots_updated_at
  BEFORE UPDATE ON public.story_background_slots
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create index for faster queries
CREATE INDEX idx_story_background_slots_story_id ON public.story_background_slots(story_id);
CREATE INDEX idx_story_background_slots_active ON public.story_background_slots(story_id, is_active);