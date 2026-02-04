import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ShoppingCart, Eye, Trash2, Package, Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  stock_quantity: number;
  is_recommended: boolean;
  product_number: string | null;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  price: number;
  discount_percentage: number | null;
  images: string[];
  mileage: number;
  first_registration_date: string;
  is_sold: boolean;
  is_reserved: boolean;
  is_featured: boolean;
  vehicle_number: string | null;
}

const Favoriten = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites, loading: favLoading, removeFavorite } = useFavorites();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/portal/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchFavoriteItems = async () => {
      if (favLoading || favorites.length === 0) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);
      
      const productIds = favorites
        .filter(f => f.item_type === 'product' && f.product_id)
        .map(f => f.product_id!);
      
      const vehicleIds = favorites
        .filter(f => f.item_type === 'vehicle' && f.vehicle_id)
        .map(f => f.vehicle_id!);

      try {
        if (productIds.length > 0) {
          const { data } = await supabase
            .from('products')
            .select('id, name, price, discount_percentage, image_url, stock_quantity, is_recommended, product_number')
            .in('id', productIds);
          setProducts(data || []);
        } else {
          setProducts([]);
        }

        if (vehicleIds.length > 0) {
          const { data } = await supabase
            .from('cars_for_sale')
            .select('id, brand, model, price, discount_percentage, images, mileage, first_registration_date, is_sold, is_reserved, is_featured, vehicle_number')
            .in('id', vehicleIds);
          setVehicles(data || []);
        } else {
          setVehicles([]);
        }
      } catch (error) {
        logError('Favoriten:fetchItems', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchFavoriteItems();
  }, [favorites, favLoading]);

  const handleAddToCart = (product: Product) => {
    // Import the product as the full Product type for the cart
    const fullProduct: import('@/types/shop').Product = {
      id: product.id,
      name: product.name,
      description: null,
      price: product.price,
      image_url: product.image_url,
      category: null,
      stock_quantity: product.stock_quantity,
      is_active: true,
      tax_rate: 19,
      discount_percentage: product.discount_percentage || undefined,
      created_at: '',
      updated_at: '',
    };

    addToCart(fullProduct, 1);
    toast.success('Produkt zum Warenkorb hinzugefügt');
  };

  const handleRemoveFavorite = async (type: 'product' | 'vehicle', id: string) => {
    await removeFavorite(type, id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  if (authLoading || favLoading || loadingData) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </PortalLayout>
    );
  }

  const productFavorites = products;
  const vehicleFavorites = vehicles;

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-serif font-bold text-foreground">Meine Favoriten</h1>
        </div>

        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Keine Favoriten vorhanden</h2>
            <p className="text-muted-foreground mb-6">
              Fügen Sie Produkte oder Fahrzeuge zu Ihren Favoriten hinzu, um sie später leicht wiederzufinden.
            </p>
            <Button asChild variant="gold">
              <Link to="/portal">Zum Katalog</Link>
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Produkte ({productFavorites.length})
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="gap-2">
                <Car className="h-4 w-4" />
                Fahrzeuge ({vehicleFavorites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {productFavorites.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Keine Produkte in Favoriten</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productFavorites.map((product) => (
                    <Card key={product.id} className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="aspect-square bg-muted relative">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {product.discount_percentage !== null && product.discount_percentage !== undefined && product.discount_percentage > 0 && (
                          <Badge className="absolute top-2 left-2 bg-red-500">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 hover:bg-background dark:bg-card/80 dark:hover:bg-card text-red-500"
                          onClick={() => handleRemoveFavorite('product', product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                          {product.discount_percentage !== null && product.discount_percentage !== undefined && product.discount_percentage > 0 ? (
                            <>
                              <span className="text-lg font-bold text-accent">
                                {formatPrice(product.price * (1 - product.discount_percentage / 100))}
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">netto</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <Link to={`/portal/produkt/${product.product_number}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="gold" 
                            className="flex-1"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock_quantity === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Anfragen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vehicles">
              {vehicleFavorites.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Keine Fahrzeuge in Favoriten</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicleFavorites.map((vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      <div className="aspect-video bg-muted relative">
                        {vehicle.images && vehicle.images.length > 0 ? (
                          <img
                            src={vehicle.images[0]}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Car className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        {vehicle.is_sold && (
                          <Badge className="absolute top-2 left-2 bg-red-600">Verkauft</Badge>
                        )}
                        {vehicle.is_reserved && !vehicle.is_sold && (
                          <Badge className="absolute top-2 left-2 bg-yellow-600">Reserviert</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-background/80 hover:bg-background dark:bg-card/80 dark:hover:bg-card text-red-500"
                          onClick={() => handleRemoveFavorite('vehicle', vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {new Date(vehicle.first_registration_date).getFullYear()} • {vehicle.mileage.toLocaleString('de-DE')} km
                        </p>
                        <div className="flex items-baseline gap-2 mb-4">
                          {vehicle.discount_percentage !== null && vehicle.discount_percentage !== undefined && vehicle.discount_percentage > 0 ? (
                            <>
                              <span className="text-lg font-bold text-accent">
                                {formatPrice(vehicle.price * (1 - vehicle.discount_percentage / 100))}
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(vehicle.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold">{formatPrice(vehicle.price)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">netto</span>
                        </div>
                        <Button size="sm" variant="outline" asChild className="w-full">
                          <Link to={`/portal/fahrzeug/${vehicle.vehicle_number}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details ansehen
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PortalLayout>
  );
};

export default Favoriten;
