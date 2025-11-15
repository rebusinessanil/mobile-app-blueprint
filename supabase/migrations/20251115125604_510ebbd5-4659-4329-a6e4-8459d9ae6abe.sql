-- Create profiles table to store user profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  whatsapp TEXT,
  rank TEXT,
  role TEXT,
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create banners table to store generated banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rank_name TEXT NOT NULL,
  rank_icon TEXT,
  rank_gradient TEXT,
  team_city TEXT,
  cheque_amount TEXT,
  achievement_photo TEXT,
  template_color INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Policies for banners
CREATE POLICY "Users can view their own banners"
  ON public.banners FOR SELECT
  USING (user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id));

CREATE POLICY "Users can create their own banners"
  ON public.banners FOR INSERT
  WITH CHECK (user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id));

CREATE POLICY "Users can update their own banners"
  ON public.banners FOR UPDATE
  USING (user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id));

CREATE POLICY "Users can delete their own banners"
  ON public.banners FOR DELETE
  USING (user_id IN (SELECT user_id FROM public.profiles WHERE auth.uid() = user_id));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();