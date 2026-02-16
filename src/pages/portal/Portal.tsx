import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, Vehicle } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { Product, ProductImage, formatCurrency, calculateDiscountedPrice } from '@/types/shop';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Clock, Package, Star, Search, X, Eye, AlertTriangle, XCircle, Percent, Car, Heart, ChevronLeft, ChevronRight, ChevronDown, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FavoriteButton } from '@/components/portal/FavoriteButton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { RecentlyViewedSection } from '@/components/portal/RecentlyViewedSection';
interface Category {
  id: string;
  name: string;
  sort_order: number;
  parent_id: string | null;
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
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentVehiclePage, setCurrentVehiclePage] = useState(1);
  const PRODUCTS_PER_PAGE = 24;
  const VEHICLES_PER_PAGE = 24;
  
  // Get initial tab from URL param or default to 'vehicles'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'products' ? 'products' : 'vehicles');
  
  // Update tab when URL param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'vehicles' || tab === 'products') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Guest access allowed - no redirect for unauthenticated users

  // Check if user is a guest (not logged in)
  const isGuest = !user;

  useEffect(() => {
    const fetchData = async () => {

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
        logError('Portal:fetchProducts', productsError);
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
        logError('Portal:fetchVehicles', vehiclesError);
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

    fetchData();
  }, [toast]);

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

  // Get parent categories (those without parent_id)
  const parentCategories = useMemo(() => {
    return categories.filter(c => c.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  // Get subcategories for a parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get all category IDs under a parent (including subcategories)
  const getCategoryIdsForParent = (parentId: string): string[] => {
    const subcats = categories.filter(c => c.parent_id === parentId);
    return subcats.map(c => c.id);
  };

  // Filter products by category and search
  // Hide products without category_id (unless admin)
  const filteredProducts = products.filter((p) => {
    // Hide products without category assignment from customers
    if (!p.category_id) {
      return false;
    }
    // If a specific subcategory is selected
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    // If only a parent category is selected, show all products in its subcategories
    if (!selectedCategory && selectedParentCategory) {
      const subcategoryIds = getCategoryIdsForParent(selectedParentCategory);
      if (!subcategoryIds.includes(p.category_id || '')) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesDescription = p.description?.toLowerCase().includes(query);
      const matchesCategory = getCategoryName(p.category_id)?.toLowerCase().includes(query);
      const matchesProductNumber = p.product_number?.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription && !matchesCategory && !matchesProductNumber) {
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
  }, [selectedCategory, selectedParentCategory, searchQuery]);

  // Reset vehicle page when filters change
  useEffect(() => {
    setCurrentVehiclePage(1);
  }, [selectedVehicleType, vehicleSearchQuery]);

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
      const matchesVehicleNumber = (v as any).vehicle_number?.toLowerCase().includes(query);
      if (!matchesBrand && !matchesModel && !matchesDescription && !matchesVehicleNumber) {
        return false;
      }
    }
    return true;
  });

  // Sort vehicles: featured first
  const sortedVehicles = useMemo(() => {
    return [...filteredVehicles].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });
  }, [filteredVehicles]);

  // Vehicle pagination calculations
  const totalVehiclePages = Math.ceil(sortedVehicles.length / VEHICLES_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentVehiclePage - 1) * VEHICLES_PER_PAGE;
    return sortedVehicles.slice(startIndex, startIndex + VEHICLES_PER_PAGE);
  }, [sortedVehicles, currentVehiclePage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMileage = (km: number) => {
    return km.toLocaleString('de-DE') + ' km';
  };

  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
    <PortalLayout showNav={!isGuest}>
      <div className="container mx-auto px-4 py-8">
        {/* Guest Banner */}
        {isGuest && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <UserPlus className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <span className="text-amber-800 dark:text-amber-200 text-sm sm:text-base">
                Registrieren Sie sich, um Produkte in den Warenkorb zu legen und Angebotsanfragen zu senden.
              </span>
              <div className="flex gap-2 mt-1 sm:mt-0 shrink-0">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-300 dark:hover:bg-amber-900/30 text-xs sm:text-sm"
                  onClick={() => navigate('/portal/auth')}
                >
                  Anmelden
                </Button>
                <Button 
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm"
                  onClick={() => navigate('/portal/auth?mode=register')}
                >
                  Registrieren
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {isGuest ? 'Willkommen im Kundenportal!' : `Willkommen, ${profile?.company_name || profile?.full_name || 'Kunde'}!`}
          </h2>
          <p className="text-muted-foreground">
            Entdecken Sie unsere Produkte und Fahrzeuge{!isGuest && ' und senden Sie uns eine Angebotsanfrage'}.
            <span className="block text-sm mt-1">Alle Preise verstehen sich als Netto-Preise zzgl. MwSt.</span>
          </p>
        </div>

        <Tabs value="vehicles" className="w-full">
          {/* Tab selector hidden - only vehicles shown */}

          {/* Products Tab - hidden from portal */}

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
              <>
                {/* Vehicle count and page info */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {sortedVehicles.length} Fahrzeuge gefunden
                    {totalVehiclePages > 1 && ` • Seite ${currentVehiclePage} von ${totalVehiclePages}`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedVehicles.map((vehicle) => {
                    const hasDiscount = (vehicle.discount_percentage ?? 0) > 0;
                    const discountedPrice = hasDiscount 
                      ? calculateDiscountedPrice(vehicle.price, vehicle.discount_percentage!) 
                      : vehicle.price;
                    const inCart = isVehicleInCart(vehicle.id);
                    
                    return (
                      <Card key={vehicle.id} className="flex flex-col relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        {!isGuest && (
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
                        )}
                        {isGuest && (vehicle.is_sold || vehicle.is_reserved) && (
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
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
                        )}
                        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                          {vehicle.is_featured && (
                            <Badge className="bg-accent text-accent-foreground flex items-center gap-1">
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
                        <Link to={`/portal/fahrzeug/${vehicle.vehicle_number}`} className="block">
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
                              Netto{vehicle.vat_deductible && ' zzgl. MwSt.'}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/portal/fahrzeug/${vehicle.vehicle_number}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Link>
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => isGuest ? navigate('/portal/auth') : handleAddVehicleToCart(vehicle)}
                            disabled={vehicle.is_sold || inCart || isGuest}
                            title={isGuest ? 'Bitte registrieren Sie sich' : undefined}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isGuest ? 'Anmelden' : inCart ? 'Im Angebot' : 'Hinzufügen'}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>

                {/* Vehicle Pagination controls */}
                {totalVehiclePages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentVehiclePage(1)}
                      disabled={currentVehiclePage === 1}
                      title="Erste Seite"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <ChevronLeft className="h-4 w-4 -ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentVehiclePage(prev => Math.max(1, prev - 1))}
                      disabled={currentVehiclePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalVehiclePages }, (_, i) => i + 1)
                        .filter(page => {
                          if (page === 1 || page === totalVehiclePages) return true;
                          if (Math.abs(page - currentVehiclePage) <= 2) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsisBefore = prevPage && page - prevPage > 1;
                          
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={currentVehiclePage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentVehiclePage(page)}
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
                      onClick={() => setCurrentVehiclePage(prev => Math.min(totalVehiclePages, prev + 1))}
                      disabled={currentVehiclePage === totalVehiclePages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentVehiclePage(totalVehiclePages)}
                      disabled={currentVehiclePage === totalVehiclePages}
                      title="Letzte Seite"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4 -ml-2" />
                    </Button>
                  </div>
                )}
              </>
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
