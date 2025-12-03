-- Add profile_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create function to auto-update profile_completed when profile is complete
CREATE OR REPLACE FUNCTION public.update_profile_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all required fields are complete
  IF NEW.name IS NOT NULL AND NEW.name != '' AND
     NEW.mobile IS NOT NULL AND LENGTH(REGEXP_REPLACE(NEW.mobile, '[^0-9]', '', 'g')) >= 10 AND
     NEW.role IS NOT NULL AND NEW.role != '' AND
     (NEW.profile_photo IS NOT NULL AND NEW.profile_photo != '')
  THEN
    NEW.profile_completed := true;
  ELSE
    NEW.profile_completed := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update profile_completed on profile changes
DROP TRIGGER IF EXISTS trigger_update_profile_completed ON public.profiles;
CREATE TRIGGER trigger_update_profile_completed
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_completed();

-- Update existing profiles to set profile_completed based on current data
UPDATE public.profiles
SET profile_completed = (
  name IS NOT NULL AND name != '' AND
  mobile IS NOT NULL AND LENGTH(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g')) >= 10 AND
  role IS NOT NULL AND role != '' AND
  profile_photo IS NOT NULL AND profile_photo != ''
);