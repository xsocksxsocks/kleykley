-- Add timestamp for admin notes
ALTER TABLE public.orders
ADD COLUMN admin_notes_updated_at TIMESTAMP WITH TIME ZONE;