-- Fix user_credits foreign key constraint issue
-- The table has a foreign key pointing to a non-existent 'users' table
-- Remove the incorrect constraint and ensure proper setup

-- Drop the incorrect foreign key if it exists
ALTER TABLE user_credits 
DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey;

-- Add proper constraint comment
COMMENT ON COLUMN user_credits.user_id IS 'References auth.users(id) but constraint not enforced to allow admin credit management';

-- Fix credit_transactions transaction_type check constraint to allow admin operations
ALTER TABLE credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;

-- Add updated constraint with admin transaction types
ALTER TABLE credit_transactions
ADD CONSTRAINT credit_transactions_transaction_type_check 
CHECK (transaction_type IN ('earned', 'spent', 'admin_grant', 'admin_deduct', 'admin_credit'));