-- Add welcome_popup_seen field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_popup_seen boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.welcome_popup_seen IS 'Tracks if user has seen and dismissed the welcome bonus popup';