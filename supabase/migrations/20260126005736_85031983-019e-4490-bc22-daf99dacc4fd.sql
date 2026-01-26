-- Fix: Add order item price validation trigger to prevent price manipulation
-- This validates prices against the actual product prices in the database

CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _product products%ROWTYPE;
  _expected_unit_price NUMERIC;
BEGIN
  -- Skip validation for vehicle items (product_id is NULL)
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch current product price from database
  SELECT * INTO _product 
  FROM products 
  WHERE id = NEW.product_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive: %', NEW.product_id;
  END IF;
  
  -- Calculate expected price with discount
  _expected_unit_price := _product.price * (1 - COALESCE(_product.discount_percentage, 0) / 100);
  
  -- Allow small rounding differences (0.02 to account for floating point)
  IF ABS(NEW.unit_price - _expected_unit_price) > 0.02 THEN
    RAISE EXCEPTION 'Price mismatch for product %: expected %, got %', 
      _product.name, _expected_unit_price, NEW.unit_price;
  END IF;
  
  -- Validate discount percentage matches
  IF COALESCE(NEW.discount_percentage, 0) != COALESCE(_product.discount_percentage, 0) THEN
    RAISE EXCEPTION 'Discount percentage mismatch for product %: expected %, got %',
      _product.name, COALESCE(_product.discount_percentage, 0), COALESCE(NEW.discount_percentage, 0);
  END IF;
  
  -- Validate total price calculation
  IF ABS(NEW.total_price - (NEW.unit_price * NEW.quantity)) > 0.02 THEN
    RAISE EXCEPTION 'Total price calculation error for product %', _product.name;
  END IF;
  
  -- Validate stock availability
  IF _product.stock_quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %',
      _product.name, _product.stock_quantity, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for order item price validation
DROP TRIGGER IF EXISTS validate_order_item_price_trigger ON order_items;
CREATE TRIGGER validate_order_item_price_trigger
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_item_price();

-- Create table to track discount code usage per user (one-time use per account)
CREATE TABLE IF NOT EXISTS public.discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, discount_code_id)
);

-- Enable RLS
ALTER TABLE public.discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own discount usage"
  ON public.discount_code_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can record their own usage (on checkout)
CREATE POLICY "Approved customers can record discount usage"
  ON public.discount_code_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_approved_customer(auth.uid()));

-- Admins can manage all usage records
CREATE POLICY "Admins can manage discount usage"
  ON public.discount_code_usage
  FOR ALL
  USING (is_admin(auth.uid()));

-- Update the validate_discount_code function to check per-user usage
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  _code TEXT,
  _order_total NUMERIC
)
RETURNS TABLE(
  id UUID,
  code TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  min_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _discount discount_codes%ROWTYPE;
  _user_id UUID;
BEGIN
  -- Get current user
  _user_id := auth.uid();
  
  -- Require approved customer
  IF NOT is_approved_customer(_user_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Find the discount code (case-insensitive)
  SELECT * INTO _discount
  FROM discount_codes
  WHERE discount_codes.code = UPPER(_code)
    AND is_active = true
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until >= now());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid discount code';
  END IF;
  
  -- Check if user has already used this code
  IF EXISTS (
    SELECT 1 FROM discount_code_usage
    WHERE user_id = _user_id AND discount_code_id = _discount.id
  ) THEN
    RAISE EXCEPTION 'You have already used this discount code';
  END IF;
  
  -- Check order total meets minimum
  IF _discount.min_order_value IS NOT NULL AND _order_total < _discount.min_order_value THEN
    RAISE EXCEPTION 'Order total must be at least %', _discount.min_order_value;
  END IF;
  
  -- Check global usage limit
  IF _discount.max_uses IS NOT NULL AND _discount.current_uses >= _discount.max_uses THEN
    RAISE EXCEPTION 'Discount code has reached maximum uses';
  END IF;
  
  -- Return validated discount info (only what's needed)
  RETURN QUERY
  SELECT 
    _discount.id,
    _discount.code,
    _discount.discount_type,
    _discount.discount_value,
    _discount.min_order_value;
END;
$$;