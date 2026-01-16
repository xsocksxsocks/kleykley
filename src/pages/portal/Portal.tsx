import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductImage, formatCurrency } from '@/types/shop';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, Package, Star, Search, X, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface ExtendedProduct extends Product {
  category_id?: string | null;
  is_recommended?: boolean;
}

const Portal: React.FC = () => {
  const { user, profile, isAdmin, isApproved, loading, signOut } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isApproved && !isAdmin) {
        setLoadingProducts(false);
        return;
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_images (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        toast({
          title: 'Fehler',
          description: 'Produkte konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } else {
        setProducts((productsData as ExtendedProduct[]) || []);
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!categoriesError && categoriesData) {
        setCategories(categoriesData);
      }

      setLoadingProducts(false);
    };

    if (user) {
      fetchData();
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

  const getCategoryName = (categoryId: string | null | undefined): string | null => {
    if (!categoryId) return null;
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || null;
  };

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    // Category filter
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesDescription = p.description?.toLowerCase().includes(query);
      const matchesCategory = getCategoryName(p.category_id)?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription && !matchesCategory) {
        return false;
      }
    }
    return true;
  });

  // Sort: recommended first
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.is_recommended && !b.is_recommended) return -1;
    if (!a.is_recommended && b.is_recommended) return 1;
    return 0;
  });

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

  // Pending approval view
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

        {/* Search and Category Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Produkte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Alle
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery 
                  ? 'Keine Treffer gefunden' 
                  : selectedCategory 
                    ? 'Keine Produkte in dieser Kategorie' 
                    : 'Keine Produkte verfügbar'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `Keine Produkte gefunden für "${searchQuery}".`
                  : selectedCategory 
                    ? 'Wählen Sie eine andere Kategorie oder zeigen Sie alle Produkte an.'
                    : 'Aktuell sind keine Produkte im Portal verfügbar.'}
              </p>
              {(selectedCategory || searchQuery) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                >
                  Filter zurücksetzen
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => {
              const imageUrl = getProductImage(product);
              const categoryName = getCategoryName(product.category_id);
              return (
                <Card key={product.id} className="flex flex-col relative">
                  {product.is_recommended && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-gold text-navy-dark flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Empfohlen
                      </Badge>
                    </div>
                  )}
                  <Link to={`/portal/produkt/${product.id}`} className="block">
                    <CardHeader>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-md mb-4 transition-transform hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <CardTitle className="text-lg hover:text-primary transition-colors">{product.name}</CardTitle>
                    </CardHeader>
                  </Link>
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
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <Link to={`/portal/produkt/${product.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Link>
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Hinzufügen
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
