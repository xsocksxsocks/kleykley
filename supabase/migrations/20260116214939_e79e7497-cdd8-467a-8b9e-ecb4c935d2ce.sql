-- Remove the overly permissive INSERT policy on email_logs
-- Edge functions using service role bypass RLS entirely, so they don't need this policy
-- This policy was allowing any authenticated user to insert fake logs

DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;