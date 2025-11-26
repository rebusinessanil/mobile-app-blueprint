-- Update the handle_new_user_credits function to give new users 0 credits instead of 10
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_earned)
  VALUES (NEW.user_id, 0, 0); -- New users start with 0 credits
  RETURN NEW;
END;
$function$;