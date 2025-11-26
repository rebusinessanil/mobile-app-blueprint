-- Create function to auto-credit welcome bonus for new users
CREATE OR REPLACE FUNCTION public.handle_welcome_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Credit ₹199 welcome bonus to new user
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

  RETURN NEW;
END;
$$;

-- Create trigger to execute welcome bonus after user credits are created
CREATE TRIGGER on_user_credits_welcome_bonus
  AFTER INSERT ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_welcome_bonus();