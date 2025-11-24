-- Add RLS policies for Birthday table
-- Allow anyone to view active birthdays
CREATE POLICY "Anyone can view active birthdays"
  ON "Birthday"
  FOR SELECT
  USING (is_active = true OR is_admin(auth.uid()));

-- Only admins can manage birthdays
CREATE POLICY "Only admins can manage birthdays"
  ON "Birthday"
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));