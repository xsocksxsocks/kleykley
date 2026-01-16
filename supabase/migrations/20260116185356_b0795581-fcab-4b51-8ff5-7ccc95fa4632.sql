-- 1. Create order_history table for tracking all status changes
CREATE TABLE public.order_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    changed_by_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Policies for order_history
CREATE POLICY "Users can view history of their orders"
ON public.order_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_history.order_id
        AND (orders.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
);

CREATE POLICY "Admins can insert order history"
ON public.order_history
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- 2. Add is_blocked column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3. Create function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked_customer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_blocked FROM public.profiles WHERE id = _user_id),
        false
    )
$$;

-- 4. Create trigger to auto-log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status::TEXT, NEW.status::TEXT, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_order_status_change();

-- 5. Create index for better query performance
CREATE INDEX idx_order_history_order_id ON public.order_history(order_id);
CREATE INDEX idx_profiles_is_blocked ON public.profiles(is_blocked) WHERE is_blocked = true;