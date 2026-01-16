-- Add product_number column to products
ALTER TABLE public.products
ADD COLUMN product_number TEXT UNIQUE;

-- Add vehicle_number column to cars_for_sale  
ALTER TABLE public.cars_for_sale
ADD COLUMN vehicle_number TEXT UNIQUE;

-- Create sequence for products
CREATE SEQUENCE IF NOT EXISTS product_number_seq START 1;

-- Create sequence for vehicles
CREATE SEQUENCE IF NOT EXISTS vehicle_number_seq START 1;

-- Function to generate product number
CREATE OR REPLACE FUNCTION public.generate_product_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.product_number IS NULL THEN
        NEW.product_number := 'P-' || LPAD(nextval('product_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- Function to generate vehicle number
CREATE OR REPLACE FUNCTION public.generate_vehicle_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.vehicle_number IS NULL THEN
        NEW.vehicle_number := 'F-' || LPAD(nextval('vehicle_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for products
CREATE TRIGGER set_product_number
    BEFORE INSERT ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_product_number();

-- Create trigger for vehicles
CREATE TRIGGER set_vehicle_number
    BEFORE INSERT ON public.cars_for_sale
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_vehicle_number();

-- Backfill existing products with numbers
WITH numbered_products AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM public.products
    WHERE product_number IS NULL
)
UPDATE public.products p
SET product_number = 'P-' || LPAD(np.rn::TEXT, 4, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Backfill existing vehicles with numbers
WITH numbered_vehicles AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM public.cars_for_sale
    WHERE vehicle_number IS NULL
)
UPDATE public.cars_for_sale v
SET vehicle_number = 'F-' || LPAD(nv.rn::TEXT, 4, '0')
FROM numbered_vehicles nv
WHERE v.id = nv.id;

-- Update sequences to continue after existing records
SELECT setval('product_number_seq', COALESCE((SELECT MAX(SUBSTRING(product_number FROM 3)::INTEGER) FROM public.products WHERE product_number IS NOT NULL), 0) + 1, false);
SELECT setval('vehicle_number_seq', COALESCE((SELECT MAX(SUBSTRING(vehicle_number FROM 3)::INTEGER) FROM public.cars_for_sale WHERE vehicle_number IS NOT NULL), 0) + 1, false);