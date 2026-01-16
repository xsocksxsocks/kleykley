-- Add admin_notes column to orders table (only visible to admins)
ALTER TABLE public.orders
ADD COLUMN admin_notes TEXT;