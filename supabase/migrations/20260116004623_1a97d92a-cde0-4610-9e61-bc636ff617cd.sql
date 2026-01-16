-- Add country to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'Deutschland';

-- Add additional fields to orders for billing and shipping
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_country text DEFAULT 'Deutschland';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_company_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country text DEFAULT 'Deutschland';