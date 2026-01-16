-- Create order_notes table for thread-style internal notes
CREATE TABLE public.order_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage order notes
CREATE POLICY "Admins can manage order notes"
    ON public.order_notes
    FOR ALL
    USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_created_at ON public.order_notes(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_order_notes_updated_at
    BEFORE UPDATE ON public.order_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();