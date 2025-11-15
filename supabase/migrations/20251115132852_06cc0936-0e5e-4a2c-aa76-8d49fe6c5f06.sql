-- Create profile_photos table to store multiple photos per user
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own photos"
  ON public.profile_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON public.profile_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON public.profile_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON public.profile_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER handle_profile_photos_updated_at
  BEFORE UPDATE ON public.profile_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_photos;