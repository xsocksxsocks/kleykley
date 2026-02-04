import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, Package, Car, Eye, X } from 'lucide-react';
import { formatCurrency } from '@/types/shop';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  product_number: string | null;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  price: number;
  discount_percentage: number | null;
  images: string[];
  first_registration_date: string;
  mileage: number;
  vehicle_number: string | null;
}

export const RecentlyViewedSection: React.FC = () => {
  const { items, clearHistory, getProductIds, getVehicleIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      const productIds = getProductIds();
      const vehicleIds = getVehicleIds();

      try {
        if (productIds.length > 0) {
          const { data } = await supabase
            .from('products')
            .select('id, name, price, discount_percentage, image_url, product_number')
            .in('id', productIds);
          
          // Sort by the order in items
          const sortedProducts = (data || []).sort((a, b) => {
            const aIndex = items.findIndex(item => item.id === a.id);
            const bIndex = items.findIndex(item => item.id === b.id);
            return aIndex - bIndex;
          });
          setProducts(sortedProducts);
        }

        if (vehicleIds.length > 0) {
          const { data } = await supabase
            .from('cars_for_sale')
            .select('id, brand, model, price, discount_percentage, images, first_registration_date, mileage, vehicle_number')
            .in('id', vehicleIds);
          
          // Sort by the order in items
          const sortedVehicles = (data || []).sort((a, b) => {
            const aIndex = items.findIndex(item => item.id === a.id);
            const bIndex = items.findIndex(item => item.id === b.id);
            return aIndex - bIndex;
          });
          setVehicles(sortedVehicles);
        }
      } catch (error) {
        logError('RecentlyViewedSection:fetchItems', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [items, getProductIds, getVehicleIds]);

  if (loading || items.length === 0) {
    return null;
  }

  const allItems = items.map(item => {
    if (item.type === 'product') {
      const product = products.find(p => p.id === item.id);
      return product ? { ...item, data: product } : null;
    } else {
      const vehicle = vehicles.find(v => v.id === item.id);
      return vehicle ? { ...item, data: vehicle } : null;
    }
  }).filter(Boolean);

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Zuletzt angesehen</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4 mr-1" />
          Löschen
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {allItems.map((item) => {
            if (!item) return null;
            
            if (item.type === 'product') {
              const product = item.data as Product;
              const hasDiscount = product.discount_percentage !== null && product.discount_percentage !== undefined && product.discount_percentage > 0;
              
              return (
                <Link 
                  key={`product-${product.id}`} 
                  to={`/portal/produkt/${product.product_number}`}
                  className="flex-shrink-0 w-48"
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                    <div className="aspect-square bg-muted relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {hasDiscount && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-xs">
                          -{product.discount_percentage}%
                        </Badge>
                      )}
                      <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                        Ware
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-sm font-bold mt-1">
                        {hasDiscount ? (
                          <span className="text-accent">
                            {formatCurrency(product.price * (1 - product.discount_percentage! / 100))}
                          </span>
                        ) : (
                          formatCurrency(product.price)
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            } else {
              const vehicle = item.data as Vehicle;
              const hasDiscount = vehicle.discount_percentage !== null && vehicle.discount_percentage !== undefined && vehicle.discount_percentage > 0;
              
              return (
                <Link 
                  key={`vehicle-${vehicle.id}`} 
                  to={`/portal/fahrzeug/${vehicle.vehicle_number}`}
                  className="flex-shrink-0 w-48"
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                    <div className="aspect-square bg-muted relative">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {hasDiscount && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-xs">
                          -{vehicle.discount_percentage}%
                        </Badge>
                      )}
                      <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs">
                        Fahrzeug
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(vehicle.first_registration_date).getFullYear()} • {vehicle.mileage.toLocaleString('de-DE')} km
                      </p>
                      <p className="text-sm font-bold mt-1">
                        {hasDiscount ? (
                          <span className="text-gold">
                            {formatCurrency(vehicle.price * (1 - vehicle.discount_percentage! / 100))}
                          </span>
                        ) : (
                          formatCurrency(vehicle.price)
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            }
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
