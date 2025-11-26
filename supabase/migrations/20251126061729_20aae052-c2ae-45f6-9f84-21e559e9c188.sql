-- Create banner_downloads table for tracking user download history
CREATE TABLE IF NOT EXISTS public.banner_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_name TEXT NOT NULL,
  banner_url TEXT,
  template_id UUID,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banner_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own downloads
CREATE POLICY "Users can view their own downloads"
ON public.banner_downloads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert their own downloads"
ON public.banner_downloads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all downloads
CREATE POLICY "Admins can view all downloads"
ON public.banner_downloads
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_banner_downloads_user_id ON public.banner_downloads(user_id);
CREATE INDEX idx_banner_downloads_downloaded_at ON public.banner_downloads(downloaded_at DESC);