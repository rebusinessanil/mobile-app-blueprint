-- Add customer_code column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_code TEXT UNIQUE;

-- Create function to generate unique 6-digit customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit code (100000 to 999999)
    new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE customer_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles without customer codes
UPDATE profiles 
SET customer_code = generate_customer_code()
WHERE customer_code IS NULL;

-- Modify handle_new_user trigger to assign customer code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, mobile, whatsapp, customer_code, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.phone, '+000000000000'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.raw_user_meta_data->>'mobile', NEW.phone, ''),
    generate_customer_code(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;