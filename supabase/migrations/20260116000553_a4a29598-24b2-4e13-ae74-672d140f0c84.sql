-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories (once authenticated)
CREATE POLICY "Authenticated users can view categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only admins can manage categories
CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add is_recommended column to products
ALTER TABLE public.products ADD COLUMN is_recommended BOOLEAN NOT NULL DEFAULT false;

-- Add category_id foreign key to products (optional, keeping text category for flexibility)
ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;