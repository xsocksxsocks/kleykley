-- Drop old tables first
DROP TABLE IF EXISTS public.vehicle_images CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;

-- Create cars_for_sale table
CREATE TABLE public.cars_for_sale (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  first_registration_date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  color TEXT,
  power_hp INTEGER,
  previous_owners INTEGER DEFAULT 1,
  price NUMERIC NOT NULL,
  description TEXT,
  description_en TEXT,
  features TEXT[],
  features_en TEXT[],
  images TEXT[] NOT NULL DEFAULT '{}',
  vehicle_type TEXT DEFAULT 'Fahrzeug',
  vat_deductible BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_sold BOOLEAN DEFAULT false,
  is_reserved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.cars_for_sale ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage cars_for_sale" 
ON public.cars_for_sale 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Approved customers and admins can view active cars" 
ON public.cars_for_sale 
FOR SELECT 
USING ((deleted_at IS NULL AND is_approved_customer(auth.uid())) OR is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_cars_for_sale_updated_at
BEFORE UPDATE ON public.cars_for_sale
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for car images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for car images
CREATE POLICY "Car images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'car-images');

CREATE POLICY "Admins can upload car images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'car-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update car images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'car-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete car images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'car-images' AND is_admin(auth.uid()));