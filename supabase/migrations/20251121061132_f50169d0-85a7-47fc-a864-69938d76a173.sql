-- Add policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Add policy to allow admins to manage all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 'Allows admin users to view all user profiles in the admin panel';
COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS 'Allows admin users to update user profile information';