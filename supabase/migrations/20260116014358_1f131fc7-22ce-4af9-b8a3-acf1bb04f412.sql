-- Reset sequences to random high starting numbers
SELECT setval('product_number_seq', floor(random() * 9000 + 1000)::bigint, false);
SELECT setval('vehicle_number_seq', floor(random() * 9000 + 1000)::bigint, false);

-- Update existing products with new random-ish numbers starting from a high base
WITH numbered_products AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM public.products
)
UPDATE public.products p
SET product_number = 'P-' || LPAD((floor(random() * 9000 + 1000)::integer + np.rn)::TEXT, 4, '0')
FROM numbered_products np
WHERE p.id = np.id;

-- Update existing vehicles with new random-ish numbers starting from a high base  
WITH numbered_vehicles AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM public.cars_for_sale
)
UPDATE public.cars_for_sale v
SET vehicle_number = 'F-' || LPAD((floor(random() * 9000 + 1000)::integer + nv.rn)::TEXT, 4, '0')
FROM numbered_vehicles nv
WHERE v.id = nv.id;

-- Update sequences to continue after the highest existing numbers
SELECT setval('product_number_seq', COALESCE((SELECT MAX(SUBSTRING(product_number FROM 3)::INTEGER) FROM public.products WHERE product_number IS NOT NULL), 1000) + 1, false);
SELECT setval('vehicle_number_seq', COALESCE((SELECT MAX(SUBSTRING(vehicle_number FROM 3)::INTEGER) FROM public.cars_for_sale WHERE vehicle_number IS NOT NULL), 1000) + 1, false);