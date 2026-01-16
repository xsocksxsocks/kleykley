-- Add discount_percentage column to cars_for_sale
ALTER TABLE public.cars_for_sale
ADD COLUMN discount_percentage numeric DEFAULT 0;