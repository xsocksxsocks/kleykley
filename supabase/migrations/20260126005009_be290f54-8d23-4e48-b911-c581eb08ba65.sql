-- Fix: Remove public access to discount_codes and create a validation function
-- This prevents users from querying all active discount codes

-- Drop the current policy that allows all approved customers to view codes
DROP POLICY IF EXISTS "Approved customers can view active codes" ON public.discount_codes;

-- Create a SECURITY DEFINER function to validate discount codes
-- This only returns the code details if the user provides the correct code
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
BEGIN
  -- Require approved customer
  IF NOT is_approved_customer(auth.uid()) THEN
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
  
  -- Check order total meets minimum
  IF _discount.min_order_value IS NOT NULL AND _order_total < _discount.min_order_value THEN
    RAISE EXCEPTION 'Order total must be at least %', _discount.min_order_value;
  END IF;
  
  -- Check usage limit
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_discount_code(TEXT, NUMERIC) TO authenticated;