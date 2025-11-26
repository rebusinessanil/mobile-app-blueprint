-- Allow authenticated users to update their own wallet balance
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
CREATE POLICY "Users can update their own credits"
ON user_credits
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert their own transaction records
DROP POLICY IF EXISTS "Users can insert their own transactions" ON credit_transactions;
CREATE POLICY "Users can insert their own transactions"
ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add comment explaining the policies
COMMENT ON POLICY "Users can update their own credits" ON user_credits IS 
'Allows users to update their own wallet balance when downloading banners or receiving credits';

COMMENT ON POLICY "Users can insert their own transactions" ON credit_transactions IS 
'Allows users to create transaction records when downloading banners (deductions) or receiving credits';