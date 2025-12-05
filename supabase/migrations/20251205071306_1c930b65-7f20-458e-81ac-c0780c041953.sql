-- Enable realtime for remaining tables (skip profiles since it's already added)
DO $$
BEGIN
  -- Try to add user_credits
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
  
  -- Try to add credit_transactions
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
  
  -- Try to add user_roles
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  EXCEPTION WHEN duplicate_object THEN
    -- Already exists, ignore
  END;
END $$;