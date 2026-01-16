import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, calculateDiscountedPrice } from '@/types/shop';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  first_registration_date: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  color: string | null;
  power_hp: number | null;
  previous_owners: number | null;
  price: number;
  description: string | null;
  features: string[] | null;
  images: string[];
  vehicle_type: string | null;
  vat_deductible: boolean | null;
  is_featured: boolean | null;
  is_sold: boolean | null;
  is_reserved: boolean | null;
  discount_percentage?: number | null;
}

export interface VehicleCartItem {
  vehicle: Vehicle;
  quantity: 1; // Vehicles are always quantity 1
}

interface CartContextType {
  items: CartItem[];
  vehicleItems: VehicleCartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  addVehicleToCart: (vehicle: Vehicle) => boolean;
  removeFromCart: (productId: string) => void;
  removeVehicleFromCart: (vehicleId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  validateCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [vehicleItems, setVehicleItems] = useState<VehicleCartItem[]>(() => {
    const saved = localStorage.getItem('cart_vehicles');
    return saved ? JSON.parse(saved) : [];
  });

  // Validate cart items against database
  const validateCart = useCallback(async () => {
    if (items.length === 0 && vehicleItems.length === 0) return;

    // Validate products
    if (items.length > 0) {
      const productIds = items.map(item => item.product.id);
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id, stock_quantity, is_active, price, discount_percentage, name')
        .in('id', productIds);

      const existingProductIds = new Set(existingProducts?.map(p => p.id) || []);
      const removedProducts: string[] = [];
      
      setItems(prev => {
        const validItems = prev.filter(item => {
          const exists = existingProductIds.has(item.product.id);
          if (!exists) {
            removedProducts.push(item.product.name);
          }
          return exists;
        }).map(item => {
          // Update product data from database
          const dbProduct = existingProducts?.find(p => p.id === item.product.id);
          if (dbProduct) {
            const updatedProduct = {
              ...item.product,
              stock_quantity: dbProduct.stock_quantity,
              is_active: dbProduct.is_active,
              price: dbProduct.price,
              discount_percentage: dbProduct.discount_percentage,
              name: dbProduct.name,
            };
            // Adjust quantity if exceeds new stock
            const newQuantity = Math.min(item.quantity, dbProduct.stock_quantity);
            return { product: updatedProduct, quantity: newQuantity > 0 ? newQuantity : 1 };
          }
          return item;
        }).filter(item => {
          // Remove if stock is 0 or product is inactive
          const dbProduct = existingProducts?.find(p => p.id === item.product.id);
          return dbProduct && dbProduct.stock_quantity > 0 && dbProduct.is_active;
        });
        
        return validItems;
      });

      if (removedProducts.length > 0) {
        toast({
          title: 'Warenkorb aktualisiert',
          description: `${removedProducts.length} Produkt(e) wurden entfernt, da sie nicht mehr verfügbar sind.`,
        });
      }
    }

    // Validate vehicles
    if (vehicleItems.length > 0) {
      const vehicleIds = vehicleItems.map(item => item.vehicle.id);
      const { data: existingVehicles } = await supabase
        .from('cars_for_sale')
        .select('id, is_sold, deleted_at')
        .in('id', vehicleIds);

      const validVehicleIds = new Set(
        existingVehicles
          ?.filter(v => !v.is_sold && !v.deleted_at)
          .map(v => v.id) || []
      );
      
      const removedVehicles: string[] = [];
      
      setVehicleItems(prev => {
        const validItems = prev.filter(item => {
          const isValid = validVehicleIds.has(item.vehicle.id);
          if (!isValid) {
            removedVehicles.push(`${item.vehicle.brand} ${item.vehicle.model}`);
          }
          return isValid;
        });
        return validItems;
      });

      if (removedVehicles.length > 0) {
        toast({
          title: 'Warenkorb aktualisiert',
          description: `${removedVehicles.length} Fahrzeug(e) wurden entfernt, da sie nicht mehr verfügbar sind.`,
        });
      }
    }
  }, [items, vehicleItems, toast]);

  // Validate cart on mount and when user navigates
  useEffect(() => {
    validateCart();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('cart_vehicles', JSON.stringify(vehicleItems));
  }, [vehicleItems]);

  const addToCart = (product: Product, quantity = 1): boolean => {
    const existing = items.find((item) => item.product.id === product.id);
    const currentQuantity = existing ? existing.quantity : 0;
    const newTotal = currentQuantity + quantity;
    
    if (newTotal > product.stock_quantity) {
      toast({
        title: 'Maximale Anzahl erreicht',
        description: `Es sind nur ${product.stock_quantity} Stück von "${product.name}" verfügbar.`,
        variant: 'destructive',
      });
      return false;
    }
    
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    return true;
  };

  const addVehicleToCart = (vehicle: Vehicle): boolean => {
    const existing = vehicleItems.find((item) => item.vehicle.id === vehicle.id);
    if (existing) {
      toast({
        title: 'Bereits im Warenkorb',
        description: `${vehicle.brand} ${vehicle.model} ist bereits in Ihrer Anfrage.`,
        variant: 'destructive',
      });
      return false;
    }

    if (vehicle.is_sold) {
      toast({
        title: 'Nicht verfügbar',
        description: 'Dieses Fahrzeug wurde bereits verkauft.',
        variant: 'destructive',
      });
      return false;
    }

    setVehicleItems((prev) => [...prev, { vehicle, quantity: 1 }]);
    return true;
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const removeVehicleFromCart = (vehicleId: string) => {
    setVehicleItems((prev) => prev.filter((item) => item.vehicle.id !== vehicleId));
  };

  const updateQuantity = (productId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return true;
    }
    
    const item = items.find((item) => item.product.id === productId);
    if (item && quantity > item.product.stock_quantity) {
      toast({
        title: 'Maximale Anzahl erreicht',
        description: `Es sind nur ${item.product.stock_quantity} Stück von "${item.product.name}" verfügbar.`,
        variant: 'destructive',
      });
      return false;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    return true;
  };

  const clearCart = () => {
    setItems([]);
    setVehicleItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) + vehicleItems.length;
  
  const productTotal = items.reduce((sum, item) => {
    const discountedPrice = calculateDiscountedPrice(item.product.price, item.product.discount_percentage);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const vehicleTotal = vehicleItems.reduce((sum, item) => {
    const discountedPrice = calculateDiscountedPrice(item.vehicle.price, item.vehicle.discount_percentage || 0);
    return sum + discountedPrice;
  }, 0);

  const totalPrice = productTotal + vehicleTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        vehicleItems,
        addToCart,
        addVehicleToCart,
        removeFromCart,
        removeVehicleFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
