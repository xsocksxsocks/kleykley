-- Add discount_percentage column to products table
ALTER TABLE public.products 
ADD COLUMN discount_percentage numeric DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);