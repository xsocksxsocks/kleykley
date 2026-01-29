-- Create table for tracking contact form submissions (rate limiting)
CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  email_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_ip_hash_created 
ON public.contact_form_submissions (ip_hash, created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- No public access policies - only service role can access this table
-- This is intentional as this table is only accessed by the edge function with service role

-- Cleanup old submissions automatically (older than 24 hours)
-- This keeps the table small and removes stale rate limit data
CREATE OR REPLACE FUNCTION public.cleanup_old_contact_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.contact_form_submissions 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Fix discount_codes RLS: Add explicit auth.uid() IS NOT NULL check
DROP POLICY IF EXISTS "Admins can manage discount codes" ON public.discount_codes;

CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_admin(auth.uid())
);