-- Fix: Remove the insecure "Users can insert their own transactions" policy
-- This prevents users from creating fake transaction records

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.credit_transactions;

-- Create a SECURITY DEFINER function for safe credit deduction
-- This atomically deducts credits AND creates a transaction record
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_category_name text DEFAULT NULL,
  p_banner_url text DEFAULT NULL,
  p_template_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
BEGIN
  -- Validate amount is positive
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Get current balance with row lock to prevent race conditions
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if user has credits record
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User credits not found');
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_current_balance);
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update the balance
  UPDATE public.user_credits
  SET 
    balance = v_new_balance,
    total_spent = total_spent + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create transaction record (negative amount for deduction)
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    created_at
  )
  VALUES (
    p_user_id,
    -p_amount,
    'spent',
    p_description,
    now()
  )
  RETURNING id INTO v_transaction_id;

  -- Create download record if category provided
  IF p_category_name IS NOT NULL THEN
    INSERT INTO public.banner_downloads (
      user_id,
      category_name,
      banner_url,
      template_id,
      downloaded_at
    )
    VALUES (
      p_user_id,
      p_category_name,
      p_banner_url,
      p_template_id,
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_user_credits TO authenticated;