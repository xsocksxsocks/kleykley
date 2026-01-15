-- Add company_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- Create product_images table for multiple images per product
CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images are viewable by approved customers and admins"
ON public.product_images FOR SELECT
USING (
    public.is_approved_customer(auth.uid()) OR public.is_admin(auth.uid())
);

CREATE POLICY "Admins can manage product images"
ON public.product_images FOR ALL
USING (public.is_admin(auth.uid()));

-- Add tax_rate to products (default 19% German MwSt)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00;

-- Add billing address fields to orders (for alternative shipping)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS billing_postal_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS use_different_shipping BOOLEAN NOT NULL DEFAULT false;