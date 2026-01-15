import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductImage, formatCurrency } from '@/types/shop';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Portal: React.FC = () => {
  const { user, profile, isAdmin, isApproved, loading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isApproved && !isAdmin) {
        setLoadingProducts(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Fehler',
          description: 'Produkte konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } else {
        setProducts((data as Product[]) || []);
      }
      setLoadingProducts(false);
    };

    if (user) {
      fetchProducts();
    }
  }, [user, isApproved, isAdmin, toast]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: 'Zur Anfrage hinzugefügt',
      description: `${product.name} wurde hinzugefügt.`,
    });
  };

  const getProductImage = (product: Product): string | null => {
    if (product.product_images && product.product_images.length > 0) {
      const sorted = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
      return sorted[0].image_url;
    }
    return product.image_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Pending approval view - no mention of automatic approval
  if (!isApproved && !isAdmin) {
    return (
      <PortalLayout showNav={false}>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle>Konto wird überprüft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vielen Dank für Ihre Registrierung. Ihr Konto wird derzeit von unserem Team 
                überprüft. Sie werden per E-Mail benachrichtigt, sobald Ihr Zugang freigeschaltet wurde.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Bei Fragen können Sie uns gerne kontaktieren.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={async () => {
                  const { signOut } = useAuth();
                  await signOut();
                  navigate('/portal/auth');
                }}
              >
                Abmelden
              </Button>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Willkommen, {profile?.company_name || profile?.full_name || 'Kunde'}!
          </h2>
          <p className="text-muted-foreground">
            Entdecken Sie unsere Produkte und senden Sie uns eine Angebotsanfrage.
            <span className="block text-sm mt-1">Alle Preise verstehen sich als Netto-Preise zzgl. MwSt.</span>
          </p>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : products.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Produkte verfügbar</h3>
              <p className="text-muted-foreground">
                Aktuell sind keine Produkte im Portal verfügbar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const imageUrl = getProductImage(product);
              return (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {product.description}
                    </p>
                    <div className="mt-4">
                      <p className="text-2xl font-bold">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Netto zzgl. {product.tax_rate}% MwSt.
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {product.stock_quantity > 0
                        ? `${product.stock_quantity} verfügbar`
                        : 'Auf Anfrage'}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Zur Anfrage hinzufügen
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Portal;
