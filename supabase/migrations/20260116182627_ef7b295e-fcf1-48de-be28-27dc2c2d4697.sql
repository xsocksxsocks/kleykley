-- Create email_logs table to track sent notifications
CREATE TABLE public.email_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email text NOT NULL,
    recipient_name text,
    notification_type text NOT NULL,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'sent',
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow edge functions to insert logs (using service role)
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_type ON public.email_logs(notification_type);