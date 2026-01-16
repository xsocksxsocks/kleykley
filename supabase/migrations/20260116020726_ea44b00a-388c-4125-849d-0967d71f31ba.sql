-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product', 'vehicle')),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.cars_for_sale(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT favorites_item_check CHECK (
    (item_type = 'product' AND product_id IS NOT NULL AND vehicle_id IS NULL) OR
    (item_type = 'vehicle' AND vehicle_id IS NOT NULL AND product_id IS NULL)
  ),
  CONSTRAINT favorites_unique_product UNIQUE (user_id, product_id),
  CONSTRAINT favorites_unique_vehicle UNIQUE (user_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can manage their own favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create documents table
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'contract', 'certificate', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents" ON public.user_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all documents
CREATE POLICY "Admins can manage documents" ON public.user_documents
  FOR ALL USING (public.is_admin(auth.uid()));

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('user-documents', 'user-documents', false);

-- Storage policies for documents
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-documents' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-documents' AND public.is_admin(auth.uid()));