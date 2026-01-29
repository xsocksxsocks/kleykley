-- Fix security issue 1: profiles table - ensure unauthenticated users cannot access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = id) OR is_admin(auth.uid()))
);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND ((auth.uid() = id) OR is_admin(auth.uid()))
);

-- Fix security issue 2: orders table - ensure unauthenticated users cannot access
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Approved customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND ((user_id = auth.uid()) OR is_admin(auth.uid()))
);

CREATE POLICY "Approved customers can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (user_id = auth.uid()) 
  AND is_approved_customer(auth.uid())
);

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND is_admin(auth.uid())
);