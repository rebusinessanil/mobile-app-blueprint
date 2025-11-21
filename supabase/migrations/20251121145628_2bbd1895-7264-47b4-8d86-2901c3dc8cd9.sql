-- Secure all user-specific data tables to require authentication
-- This prevents anonymous users from even attempting to query user data

-- Fix banners table policies
DROP POLICY IF EXISTS "Users can view their own banners" ON public.banners;
DROP POLICY IF EXISTS "Users can create their own banners" ON public.banners;
DROP POLICY IF EXISTS "Users can update their own banners" ON public.banners;
DROP POLICY IF EXISTS "Users can delete their own banners" ON public.banners;

CREATE POLICY "Authenticated users can view their own banners"
ON public.banners FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create their own banners"
ON public.banners FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own banners"
ON public.banners FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own banners"
ON public.banners FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Fix banner_stickers table policies
DROP POLICY IF EXISTS "Users can view their banner stickers" ON public.banner_stickers;
DROP POLICY IF EXISTS "Users can manage their banner stickers" ON public.banner_stickers;

CREATE POLICY "Authenticated users can view their banner stickers"
ON public.banner_stickers FOR SELECT TO authenticated
USING (banner_id IN (SELECT id FROM banners WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can manage their banner stickers"
ON public.banner_stickers FOR ALL TO authenticated
USING (banner_id IN (SELECT id FROM banners WHERE user_id = auth.uid()))
WITH CHECK (banner_id IN (SELECT id FROM banners WHERE user_id = auth.uid()));

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Fix profile_photos table policies
DROP POLICY IF EXISTS "Users can view their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.profile_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.profile_photos;

CREATE POLICY "Authenticated users can view their own photos"
ON public.profile_photos FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own photos"
ON public.profile_photos FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own photos"
ON public.profile_photos FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own photos"
ON public.profile_photos FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Fix user_banner_settings table policies
DROP POLICY IF EXISTS "Users can view their own banner settings" ON public.user_banner_settings;
DROP POLICY IF EXISTS "Users can insert their own banner settings" ON public.user_banner_settings;
DROP POLICY IF EXISTS "Users can update their own banner settings" ON public.user_banner_settings;

CREATE POLICY "Authenticated users can view their own banner settings"
ON public.user_banner_settings FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert their own banner settings"
ON public.user_banner_settings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own banner settings"
ON public.user_banner_settings FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Fix user_credits table policies
DROP POLICY IF EXISTS "Users can view their own credits" ON public.user_credits;

CREATE POLICY "Authenticated users can view their own credits"
ON public.user_credits FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Fix credit_transactions table policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.credit_transactions;

CREATE POLICY "Authenticated users can view their own transactions"
ON public.credit_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());