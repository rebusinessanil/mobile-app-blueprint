-- Enable REPLICA IDENTITY FULL for real-time updates on user_credits and credit_transactions
ALTER TABLE public.user_credits REPLICA IDENTITY FULL;
ALTER TABLE public.credit_transactions REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication if not already added
DO $$
BEGIN
  -- Add user_credits if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_credits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
  END IF;
  
  -- Add credit_transactions if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'credit_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
  END IF;
END $$;