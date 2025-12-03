-- Update the handle_welcome_bonus function to prevent duplicate credits
CREATE OR REPLACE FUNCTION public.handle_welcome_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- ONLY credit bonus if:
  -- 1. profile_completion_bonus_given was false before
  -- 2. profile_completion_bonus_given is now being set to true
  -- This ensures bonus is credited exactly once
  
  IF OLD.profile_completion_bonus_given = false AND NEW.profile_completion_bonus_given = true THEN
    -- Credit ₹199 welcome bonus to user
    UPDATE public.user_credits
    SET 
      balance = balance + 199,
      total_earned = total_earned + 199,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;

    -- Create transaction record for welcome bonus
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      created_at
    )
    VALUES (
      NEW.user_id,
      199,
      'admin_credit',
      'Welcome Bonus Credited',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger fires on UPDATE to profiles table (when profile_completion_bonus_given changes)
DROP TRIGGER IF EXISTS on_profile_completion_bonus ON public.profiles;

CREATE TRIGGER on_profile_completion_bonus
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.profile_completion_bonus_given IS DISTINCT FROM NEW.profile_completion_bonus_given)
  EXECUTE FUNCTION public.handle_welcome_bonus();