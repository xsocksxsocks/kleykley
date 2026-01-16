import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, Vehicle } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductImage, formatCurrency, calculateDiscountedPrice } from '@/types/shop';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Clock, Package, Star, Search, X, Eye, AlertTriangle, XCircle, Percent, Car, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FavoriteButton } from '@/components/portal/FavoriteButton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { RecentlyViewedSection } from '@/components/portal/RecentlyViewedSection';
interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface ExtendedProduct extends Product {
  category_id?: string | null;
  is_recommended?: boolean;
  discount_percentage?: number;
  product_number?: string | null;
}

const VEHICLE_TYPES = [
  { value: 'all', label: 'Alle' },
  { value: 'Fahrzeug', label: 'Fahrzeuge' },
  { value: 'Motorrad', label: 'Motorräder' },
  { value: 'Baumaschine', label: 'Baumaschinen' },
];

const Portal: React.FC = () => {
  const { user, profile, isAdmin, isApproved, loading, signOut } = useAuth();
  const { addToCart, addVehicleToCart, vehicleItems } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 24;
  
  // Get initial tab from URL param or default to 'products'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'vehicles' ? 'vehicles' : 'products');
  
  // Update tab when URL param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'vehicles' || tab === 'products') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isApproved && !isAdmin) {
        setLoadingProducts(false);
        setLoadingVehicles(false);
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

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('cars_for_sale')
        .select('*')
        .is('deleted_at', null)
        .eq('is_sold', false)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        toast({
          title: 'Fehler',
          description: 'Fahrzeuge konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } else {
        setVehicles((vehiclesData as Vehicle[]) || []);
      }

      setLoadingVehicles(false);
    };

    if (user) {
      fetchData();
    }
  }, [user, isApproved, isAdmin, toast]);

  const handleAddToCart = (product: Product) => {
    const success = addToCart(product);
    if (success) {
      toast({
        title: 'Zum Angebot hinzugefügt',
      });
    }
  };

  const handleAddVehicleToCart = (vehicle: Vehicle) => {
    const success = addVehicleToCart(vehicle);
    if (success) {
      toast({
        title: 'Zum Angebot hinzugefügt',
        description: `${vehicle.brand} ${vehicle.model} wurde zur Anfrage hinzugefügt.`,
      });
    }
  };

  const isVehicleInCart = (vehicleId: string) => {
    return vehicleItems.some(item => item.vehicle.id === vehicleId);
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
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
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
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (a.is_recommended && !b.is_recommended) return -1;
      if (!a.is_recommended && b.is_recommended) return 1;
      return 0;
    });
  }, [filteredProducts]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Filter vehicles by type and search
  const filteredVehicles = vehicles.filter((v) => {
    if (selectedVehicleType !== 'all' && v.vehicle_type !== selectedVehicleType) {
      return false;
    }
    if (vehicleSearchQuery.trim()) {
      const query = vehicleSearchQuery.toLowerCase();
      const matchesBrand = v.brand.toLowerCase().includes(query);
      const matchesModel = v.model.toLowerCase().includes(query);
      const matchesDescription = v.description?.toLowerCase().includes(query);
      if (!matchesBrand && !matchesModel && !matchesDescription) {
        return false;
      }
    }
    return true;
  });

  // Sort vehicles: featured first
  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMileage = (km: number) => {
    return km.toLocaleString('de-DE') + ' km';
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

  // Rejected view
  if (profile && profile.approval_status === 'rejected' && !isAdmin) {
    return (
      <PortalLayout showNav={true}>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle>Konto abgelehnt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Leider konnten wir Ihre Registrierung nicht genehmigen. Falls Sie Fragen haben 
                oder der Meinung sind, dass es sich um einen Fehler handelt, kontaktieren Sie uns bitte.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Wir helfen Ihnen gerne weiter.
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

  // Pending approval view
  if (profile && profile.approval_status === 'pending' && !isAdmin) {
    return (
      <PortalLayout showNav={true}>
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
            Entdecken Sie unsere Produkte und Fahrzeuge und senden Sie uns eine Angebotsanfrage.
            <span className="block text-sm mt-1">Alle Preise verstehen sich als Netto-Preise zzgl. MwSt.</span>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Waren
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Fahrzeuge
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {/* Search and Category Filter */}
            <div className="mb-6 space-y-4">
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
              <>
                {/* Product count and page info */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {sortedProducts.length} Produkte gefunden
                    {totalPages > 1 && ` • Seite ${currentPage} von ${totalPages}`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedProducts.map((product) => {
                    const imageUrl = getProductImage(product);
                    return (
                      <Card key={product.id} className="flex flex-col relative">
                        <div className="absolute top-2 left-2 z-10">
                          <FavoriteButton itemType="product" itemId={product.id} className="bg-background/80 hover:bg-background dark:bg-card/80 dark:hover:bg-card" />
                        </div>
                        {(product.is_recommended || (product.discount_percentage !== undefined && product.discount_percentage !== null && product.discount_percentage > 0)) && (
                          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                            {product.is_recommended && (
                              <Badge className="bg-gold text-navy-dark flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                Empfohlen
                              </Badge>
                            )}
                            {product.discount_percentage !== undefined && product.discount_percentage !== null && product.discount_percentage > 0 && (
                              <Badge className="bg-red-500 text-white flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                -{product.discount_percentage}%
                              </Badge>
                            )}
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
                            {(product as any).product_number && (
                              <p className="text-xs text-muted-foreground mt-1">Art.-Nr.: {(product as any).product_number}</p>
                            )}
                          </CardHeader>
                        </Link>
                        <CardContent className="flex-1">
                          {product.description && (
                            <p className="text-muted-foreground text-sm line-clamp-3">
                              {product.description}
                            </p>
                          )}
                          <div className="mt-4">
                            {product.discount_percentage !== undefined && product.discount_percentage !== null && product.discount_percentage > 0 ? (
                              <>
                                <p className="text-sm text-muted-foreground line-through">
                                  {formatCurrency(product.price)}
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                  {formatCurrency(calculateDiscountedPrice(product.price, product.discount_percentage))}
                                </p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold">
                                {formatCurrency(product.price)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Netto zzgl. {product.tax_rate}% MwSt.
                            </p>
                          </div>
                          {product.stock_quantity > 0 && product.stock_quantity <= 5 ? (
                            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Nur noch {product.stock_quantity} verfügbar
                            </p>
                          ) : product.stock_quantity > 0 ? (
                            <p className="text-sm text-muted-foreground mt-2">
                              {product.stock_quantity} verfügbar
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">
                              Auf Anfrage
                            </p>
                          )}
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

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      Erste
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current, and pages around current
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 2) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          // Add ellipsis between gaps
                          const prevPage = array[index - 1];
                          const showEllipsisBefore = prevPage && page - prevPage > 1;
                          
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Letzte
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            {/* Search and Vehicle Type Filter */}
            <div className="mb-6 space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Fahrzeuge suchen..."
                  value={vehicleSearchQuery}
                  onChange={(e) => setVehicleSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {vehicleSearchQuery && (
                  <button
                    onClick={() => setVehicleSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedVehicleType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVehicleType(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {loadingVehicles ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sortedVehicles.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {vehicleSearchQuery 
                      ? 'Keine Treffer gefunden' 
                      : selectedVehicleType !== 'all' 
                        ? 'Keine Fahrzeuge in dieser Kategorie' 
                        : 'Keine Fahrzeuge verfügbar'}
                  </h3>
                  <p className="text-muted-foreground">
                    {vehicleSearchQuery 
                      ? `Keine Fahrzeuge gefunden für "${vehicleSearchQuery}".`
                      : selectedVehicleType !== 'all' 
                        ? 'Wählen Sie eine andere Kategorie oder zeigen Sie alle Fahrzeuge an.'
                        : 'Aktuell sind keine Fahrzeuge im Portal verfügbar.'}
                  </p>
                  {(selectedVehicleType !== 'all' || vehicleSearchQuery) && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSelectedVehicleType('all');
                        setVehicleSearchQuery('');
                      }}
                    >
                      Filter zurücksetzen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedVehicles.map((vehicle) => {
                  const hasDiscount = (vehicle.discount_percentage ?? 0) > 0;
                  const discountedPrice = hasDiscount 
                    ? calculateDiscountedPrice(vehicle.price, vehicle.discount_percentage!) 
                    : vehicle.price;
                  const inCart = isVehicleInCart(vehicle.id);
                  
                  return (
                    <Card key={vehicle.id} className="flex flex-col relative">
                      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        <FavoriteButton itemType="vehicle" itemId={vehicle.id} className="bg-background/80 hover:bg-background dark:bg-card/80 dark:hover:bg-card" />
                        {vehicle.is_sold && (
                          <Badge className="bg-destructive text-destructive-foreground">
                            Verkauft
                          </Badge>
                        )}
                        {vehicle.is_reserved && !vehicle.is_sold && (
                          <Badge className="bg-amber-500 text-white">
                            Reserviert
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                        {vehicle.is_featured && (
                          <Badge className="bg-gold text-navy-dark flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Empfohlen
                          </Badge>
                        )}
                        {hasDiscount && (
                          <Badge className="bg-red-500 text-white flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            -{vehicle.discount_percentage}%
                          </Badge>
                        )}
                        {vehicle.vat_deductible && (
                          <Badge variant="outline" className="bg-background/80 text-xs">
                            MwSt. ausweisbar
                          </Badge>
                        )}
                      </div>
                      <Link to={`/portal/fahrzeug/${vehicle.id}`} className="block">
                        <CardHeader>
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img
                              src={vehicle.images[0]}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="w-full h-48 object-cover rounded-md mb-4 transition-transform hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <CardTitle className="text-lg hover:text-primary transition-colors">{vehicle.brand} {vehicle.model}</CardTitle>
                          {(vehicle as any).vehicle_number && (
                            <p className="text-xs text-muted-foreground mt-1">Fzg.-Nr.: {(vehicle as any).vehicle_number}</p>
                          )}
                        </CardHeader>
                      </Link>
                      <CardContent className="flex-1">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>EZ: {formatDate(vehicle.first_registration_date)}</p>
                          <p>{formatMileage(vehicle.mileage)}</p>
                          <p>{vehicle.fuel_type} • {vehicle.transmission}</p>
                          {vehicle.power_hp && <p>{vehicle.power_hp} PS</p>}
                          {vehicle.color && <p>{vehicle.color}</p>}
                        </div>
                        <div className="mt-4">
                          {hasDiscount ? (
                            <>
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(vehicle.price)}
                              </p>
                              <p className="text-2xl font-bold text-red-600">
                                {formatCurrency(discountedPrice)}
                              </p>
                            </>
                          ) : (
                            <p className="text-2xl font-bold">
                              {formatCurrency(vehicle.price)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Netto zzgl. MwSt.
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link to={`/portal/fahrzeug/${vehicle.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Link>
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => handleAddVehicleToCart(vehicle)}
                          disabled={vehicle.is_sold || inCart}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {inCart ? 'Im Angebot' : 'Hinzufügen'}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <RecentlyViewedSection />
        </div>
      </div>
    </PortalLayout>
  );
};

export default Portal;
