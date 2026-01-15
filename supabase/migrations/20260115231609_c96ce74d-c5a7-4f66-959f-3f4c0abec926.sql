-- Fix security warnings: Add SET search_path to all functions

-- Fix calculate_scheduled_approval_time
CREATE OR REPLACE FUNCTION public.calculate_scheduled_approval_time(registration_time TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    approval_time TIMESTAMP WITH TIME ZONE;
    reg_hour INTEGER;
    next_day_8am TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Add 3 hours to registration time
    approval_time := registration_time + INTERVAL '3 hours';
    reg_hour := EXTRACT(HOUR FROM approval_time AT TIME ZONE 'Europe/Berlin');
    
    -- If approval time is between 20:00 and 23:59 or 00:00 and 07:59
    -- Schedule for 8:00 the next available day
    IF reg_hour >= 20 OR reg_hour < 8 THEN
        -- Calculate next day at 8:00
        IF reg_hour >= 20 THEN
            next_day_8am := (DATE(approval_time AT TIME ZONE 'Europe/Berlin') + INTERVAL '1 day')::DATE + TIME '08:00:00';
        ELSE
            next_day_8am := DATE(approval_time AT TIME ZONE 'Europe/Berlin')::DATE + TIME '08:00:00';
        END IF;
        approval_time := next_day_8am AT TIME ZONE 'Europe/Berlin';
    END IF;
    
    RETURN approval_time;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.order_number := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$;