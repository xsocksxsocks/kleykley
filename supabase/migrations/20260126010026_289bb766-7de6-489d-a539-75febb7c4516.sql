-- Create a trigger to automatically increment discount code usage counter when usage is recorded
CREATE OR REPLACE FUNCTION public.increment_discount_code_usage_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE discount_codes
  SET current_uses = current_uses + 1
  WHERE id = NEW.discount_code_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-increment usage counter
DROP TRIGGER IF EXISTS increment_discount_usage_trigger ON discount_code_usage;
CREATE TRIGGER increment_discount_usage_trigger
  AFTER INSERT ON discount_code_usage
  FOR EACH ROW
  EXECUTE FUNCTION increment_discount_code_usage_on_insert();