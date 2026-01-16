-- Add original price and discount percentage to order_items
ALTER TABLE public.order_items 
ADD COLUMN original_unit_price numeric,
ADD COLUMN discount_percentage numeric DEFAULT 0;