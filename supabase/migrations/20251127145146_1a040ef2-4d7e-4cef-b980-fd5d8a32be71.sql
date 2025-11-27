-- Add Google OAuth support fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS google_uid text UNIQUE,
ADD COLUMN IF NOT EXISTS signup_method text DEFAULT 'email' CHECK (signup_method IN ('email', 'google'));

-- Add index for faster Google UID lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_uid ON public.profiles(google_uid);

-- Update the handle_new_user function to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  signup_method_val text;
  google_uid_val text;
BEGIN
  -- Determine signup method based on provider
  IF NEW.raw_app_meta_data->>'provider' = 'google' THEN
    signup_method_val := 'google';
    google_uid_val := NEW.id::text;
  ELSE
    signup_method_val := 'email';
    google_uid_val := NULL;
  END IF;

  INSERT INTO public.profiles (
    user_id, 
    name, 
    mobile, 
    whatsapp, 
    customer_code, 
    google_uid,
    signup_method,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email, 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.phone, '+000000000000'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.raw_user_meta_data->>'mobile', NEW.phone, ''),
    generate_customer_code(),
    google_uid_val,
    signup_method_val,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;