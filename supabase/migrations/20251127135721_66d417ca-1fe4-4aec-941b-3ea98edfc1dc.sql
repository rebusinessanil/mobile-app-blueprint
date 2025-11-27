-- Fix foreign key constraint on credit_transactions table
-- The issue is that credit_transactions.user_id has a foreign key to auth.users
-- but it should not have any foreign key (user_id should reference profiles, not auth.users directly)

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

-- No need to add a new foreign key because:
-- 1. The types.ts shows Relationships: [] (no foreign keys)
-- 2. user_id should be a simple UUID that matches profiles.user_id
-- 3. RLS policies handle the security, not foreign keys

-- Add a comment to document this decision
COMMENT ON COLUMN public.credit_transactions.user_id IS 
'References user_id from profiles table. No foreign key constraint to avoid auth.users dependency issues.';