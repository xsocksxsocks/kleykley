import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, LogOut, Settings, Clock, Package, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Portal: React.FC = () => {
  const { user, profile, isAdmin, isApproved, signOut, loading } = useAuth();
  const { addToCart, totalItems } = useCart();
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
        .select('*')
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/auth');
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
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Kley Kundenportal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{profile?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
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
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Kley Kundenportal</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/anfragen">
                <FileText className="h-4 w-4 mr-2" />
                Meine Anfragen
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/warenkorb">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Anfrage
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Willkommen, {profile?.full_name || 'Kunde'}!</h2>
          <p className="text-muted-foreground">
            Entdecken Sie unsere Produkte und senden Sie uns eine Angebotsanfrage.
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
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
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
                  <p className="text-2xl font-bold mt-4">
                    {product.price.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Portal;
