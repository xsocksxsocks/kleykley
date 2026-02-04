import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Star, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  Minus,
  Plus,
  AlertTriangle,
  Percent,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { FavoriteButton } from '@/components/portal/FavoriteButton';
interface Category {
  id: string;
  name: string;
}

interface ImageData {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  stock_quantity: number;
  is_active: boolean;
  tax_rate: number;
  is_recommended: boolean;
  discount_percentage: number;
  product_number: string | null;
  created_at: string;
  updated_at: string;
}

const calculateDiscountedPrice = (price: number, discountPercentage: number = 0): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
};

const ProduktDetail: React.FC = () => {
  const { productNumber } = useParams<{ productNumber: string }>();
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useRecentlyViewed();

  // Check if user is a guest (not logged in)
  const isGuest = !user;

  // Track recently viewed - we'll update this after we have the product ID
  useEffect(() => {
    if (product?.id) {
      addItem(product.id, 'product');
    }
  }, [product?.id, addItem]);

  // Guest access allowed - no redirect for unauthenticated users

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productNumber) {
        setLoadingProduct(false);
        return;
      }
      // Fetch product by product_number
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_number', productNumber)
        .eq('is_active', true)
        .maybeSingle();

      if (productError) {
        logError('ProduktDetail:fetchProduct', productError);
        toast({
          title: 'Fehler',
          description: 'Produkt konnte nicht geladen werden.',
          variant: 'destructive',
        });
        setLoadingProduct(false);
        return;
      }

      if (!productData) {
        setLoadingProduct(false);
        return;
      }

      setProduct(productData as ProductData);

      // Fetch images
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productData.id)
        .order('sort_order', { ascending: true });

      if (imagesData && imagesData.length > 0) {
        setImages(imagesData as ImageData[]);
      } else if (productData.image_url) {
        // Use fallback image
        setImages([{ 
          id: 'fallback', 
          product_id: productData.id, 
          image_url: productData.image_url, 
          sort_order: 0,
          created_at: ''
        }]);
      }

      // Fetch category if exists
      if ((productData as any).category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', (productData as any).category_id)
          .maybeSingle();

        if (categoryData) {
          setCategory(categoryData as Category);
        }
      }

      setLoadingProduct(false);
    };

    fetchProduct();
  }, [productNumber, toast]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Convert to the format expected by cart
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active,
      tax_rate: product.tax_rate,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
    
    // Add product with desired quantity (addToCart handles the quantity now)
    const success = addToCart(cartProduct, quantity);
    
    if (success) {
      toast({
        title: 'Zum Angebot hinzugefügt',
      });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading || loadingProduct) {
    return (
      <PortalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PortalLayout>
    );
  }

  if (!product) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Produkt nicht gefunden</h3>
              <p className="text-muted-foreground mb-4">
                Dieses Produkt existiert nicht oder ist nicht mehr verfügbar.
              </p>
              <Button asChild>
                <Link to="/portal">Zurück zum Katalog</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  const currentImage = images[currentImageIndex];

  return (
    <PortalLayout showNav={!isGuest}>
      <div className="container mx-auto px-4 py-8">
        {/* Guest Banner */}
        {isGuest && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <UserPlus className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-amber-800 dark:text-amber-200">
                Registrieren Sie sich, um dieses Produkt in den Warenkorb zu legen.
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:border-amber-500 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  onClick={() => navigate('/portal/auth')}
                >
                  Anmelden
                </Button>
                <Button 
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => navigate('/portal/auth?mode=register')}
                >
                  Registrieren
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/portal">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Katalog
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <>
                  <img
                    src={currentImage?.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.is_recommended && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-accent text-accent-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Empfohlen
                      </Badge>
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.name} - Bild ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category & Title */}
            <div>
              {category && (
                <Badge variant="secondary" className="mb-2">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {product.product_number && (
                <p className="text-sm text-muted-foreground mt-1">Art.-Nr.: {product.product_number}</p>
              )}
            </div>

            {/* Price */}
            <div className="border-y py-4">
              {product.discount_percentage && product.discount_percentage > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-500 text-white flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      -{product.discount_percentage}% Rabatt
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-4xl font-bold text-red-600">
                    {formatCurrency(calculateDiscountedPrice(product.price, product.discount_percentage))}
                  </p>
                </>
              ) : (
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Netto zzgl. {product.tax_rate}% MwSt. = {formatCurrency(calculateDiscountedPrice(product.price, product.discount_percentage || 0) * (1 + product.tax_rate / 100))} brutto
              </p>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              {product.stock_quantity > 0 && product.stock_quantity <= 5 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-600 font-medium">
                    Nur noch {product.stock_quantity} Stück verfügbar
                  </span>
                </>
              ) : (
                <>
                  <div className={`w-3 h-3 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} Stück verfügbar`
                      : 'Auf Anfrage verfügbar'}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">Beschreibung</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Menge:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={product.stock_quantity > 0 ? product.stock_quantity : undefined}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxVal = product.stock_quantity > 0 ? product.stock_quantity : val;
                      setQuantity(Math.max(1, Math.min(val, maxVal)));
                    }}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const maxVal = product.stock_quantity > 0 ? product.stock_quantity : quantity + 1;
                      setQuantity(Math.min(quantity + 1, maxVal));
                    }}
                    disabled={product.stock_quantity > 0 && quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.stock_quantity > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (max. {product.stock_quantity})
                  </span>
                )}
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={() => isGuest ? navigate('/portal/auth') : handleAddToCart()}
                disabled={isGuest}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isGuest ? 'Anmelden zum Hinzufügen' : 'Zur Anfrage hinzufügen'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {isGuest 
                  ? 'Bitte registrieren Sie sich, um Produkte anzufragen.'
                  : 'Die endgültigen Preise erhalten Sie in Ihrem individuellen Angebot.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProduktDetail;
