-- Fix search path security issue by recreating function with proper settings
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;