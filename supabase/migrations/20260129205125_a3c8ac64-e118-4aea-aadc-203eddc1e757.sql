
-- Allow public (guest) access to view active products
DROP POLICY IF EXISTS "Approved customers and admins can view active products" ON public.products;

CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- Allow public (guest) access to view product images
DROP POLICY IF EXISTS "Product images are viewable by approved customers and admins" ON public.product_images;

CREATE POLICY "Anyone can view product images" 
ON public.product_images 
FOR SELECT 
USING (true);

-- Allow public (guest) access to view categories
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

-- Allow public (guest) access to view active vehicles
DROP POLICY IF EXISTS "Approved customers and admins can view active cars" ON public.cars_for_sale;

CREATE POLICY "Anyone can view active vehicles" 
ON public.cars_for_sale 
FOR SELECT 
USING (deleted_at IS NULL AND is_sold = false);
