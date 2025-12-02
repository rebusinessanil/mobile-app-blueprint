-- Add column to track if profile completion bonus was given
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completion_bonus_given boolean DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.profile_completion_bonus_given IS 'Tracks if user received the 199 credits profile completion bonus';