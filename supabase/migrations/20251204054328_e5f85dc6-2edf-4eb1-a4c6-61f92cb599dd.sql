-- Add welcome_bonus_given field to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_bonus_given boolean DEFAULT false;

-- Update existing users who already received the bonus to have welcome_bonus_given = true
UPDATE public.profiles p
SET welcome_bonus_given = true
WHERE EXISTS (
  SELECT 1 FROM public.credit_transactions ct
  WHERE ct.user_id = p.user_id 
  AND (ct.description ILIKE '%welcome bonus%' OR ct.description ILIKE '%Welcome Bonus%')
);

-- Drop and recreate the trigger function with strict duplicate prevention
CREATE OR REPLACE FUNCTION public.handle_welcome_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bonus_already_given boolean;
  existing_bonus_count integer;
BEGIN
  -- ONLY credit bonus if:
  -- 1. welcome_bonus_given was false before
  -- 2. profile_completion_bonus_given is now being set to true
  -- 3. No welcome bonus transaction already exists for this user
  
  IF OLD.profile_completion_bonus_given = false AND NEW.profile_completion_bonus_given = true THEN
    -- Double-check: Has bonus already been given?
    SELECT welcome_bonus_given INTO bonus_already_given 
    FROM public.profiles 
    WHERE user_id = NEW.user_id;
    
    IF bonus_already_given = true THEN
      -- Bonus already given, skip
      RETURN NEW;
    END IF;
    
    -- Triple-check: Count existing welcome bonus transactions
    SELECT COUNT(*) INTO existing_bonus_count 
    FROM public.credit_transactions 
    WHERE user_id = NEW.user_id 
    AND (description ILIKE '%welcome bonus%' OR description ILIKE '%Welcome Bonus%');
    
    IF existing_bonus_count > 0 THEN
      -- Bonus transaction already exists, mark flag and skip
      NEW.welcome_bonus_given := true;
      RETURN NEW;
    END IF;
    
    -- All checks passed - credit the bonus
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
    
    -- Mark welcome bonus as given
    NEW.welcome_bonus_given := true;
  END IF;

  RETURN NEW;
END;
$$;