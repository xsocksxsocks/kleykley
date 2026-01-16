-- Add deletion scheduling columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN deletion_requested_at timestamp with time zone,
ADD COLUMN deletion_scheduled_at timestamp with time zone;

-- Create function to calculate deletion date (30 days from now)
CREATE OR REPLACE FUNCTION public.calculate_deletion_date(request_time timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN request_time + INTERVAL '30 days';
END;
$$;

-- Create function to request account deletion
CREATE OR REPLACE FUNCTION public.request_account_deletion(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_time timestamp with time zone := now();
BEGIN
    UPDATE public.profiles
    SET 
        deletion_requested_at = request_time,
        deletion_scheduled_at = public.calculate_deletion_date(request_time)
    WHERE id = user_id;
END;
$$;

-- Create function to cancel account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        deletion_requested_at = NULL,
        deletion_scheduled_at = NULL
    WHERE id = user_id;
END;
$$;