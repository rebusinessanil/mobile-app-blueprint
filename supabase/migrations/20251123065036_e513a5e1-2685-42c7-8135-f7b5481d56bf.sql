-- First, update any existing NULL mobile values with a placeholder
UPDATE public.profiles 
SET mobile = '+000000000000'
WHERE mobile IS NULL;

-- Now make mobile number mandatory in profiles table
ALTER TABLE public.profiles 
ALTER COLUMN mobile SET NOT NULL;

-- Update handle_new_user function to ensure mobile is saved from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, mobile, whatsapp, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.phone, '+000000000000'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.raw_user_meta_data->>'mobile', NEW.phone, ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;