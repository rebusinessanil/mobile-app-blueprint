-- SECURITY FIX: Remove dangerous policy that allows users to set their own credit balance
-- The deduct_user_credits SECURITY DEFINER function is the ONLY safe way to modify credits

DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;