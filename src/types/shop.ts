export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  registered_at: string;
  approved_at: string | null;
  scheduled_approval_at: string | null;
  deletion_requested_at: string | null;
  deletion_scheduled_at: string | null;
  is_blocked?: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'customer';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  category_id?: string | null;
  product_number?: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_recommended?: boolean;
  tax_rate: number;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  company_name: string | null;
  use_different_shipping: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  original_unit_price?: number | null;
  discount_percentage?: number | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Helper function to calculate tax
export const calculateTax = (netPrice: number, taxRate: number): number => {
  return netPrice * (taxRate / 100);
};

export const calculateGrossPrice = (netPrice: number, taxRate: number): number => {
  return netPrice + calculateTax(netPrice, taxRate);
};

// Helper function to calculate discounted price
export const calculateDiscountedPrice = (price: number, discountPercentage: number = 0): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
};
