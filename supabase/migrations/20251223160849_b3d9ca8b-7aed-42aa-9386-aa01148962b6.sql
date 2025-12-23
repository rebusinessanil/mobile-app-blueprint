-- Create deleted_accounts table to store hashed emails of permanently deleted accounts
CREATE TABLE public.deleted_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL UNIQUE,
  deleted_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to manage this table (via edge functions)
-- No user-facing policies - this is internal only

-- Create a function to hash emails consistently
CREATE OR REPLACE FUNCTION public.hash_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(lower(trim(email))::bytea), 'hex')
$$;

-- Create a function to check if an email is blocked
CREATE OR REPLACE FUNCTION public.is_email_blocked(email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deleted_accounts
    WHERE email_hash = public.hash_email(email)
  )
$$;