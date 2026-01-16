-- Create enum for vehicle types
CREATE TYPE vehicle_type AS ENUM ('auto', 'motorrad', 'baumaschine');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  vehicle_type vehicle_type NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  price NUMERIC NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle_images table for multiple images
CREATE TABLE public.vehicle_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for vehicles
CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Approved customers and admins can view active vehicles" 
ON public.vehicles 
FOR SELECT 
USING ((is_active = true AND is_approved_customer(auth.uid())) OR is_admin(auth.uid()));

-- RLS policies for vehicle_images
CREATE POLICY "Admins can manage vehicle images" 
ON public.vehicle_images 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Vehicle images are viewable by approved customers and admins" 
ON public.vehicle_images 
FOR SELECT 
USING (is_approved_customer(auth.uid()) OR is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();