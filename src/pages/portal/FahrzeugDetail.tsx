import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, Vehicle } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Car, Star, ShoppingCart, Calendar, Gauge, Fuel, Settings, Users, Palette, Check, Percent, UserPlus } from 'lucide-react';
import { formatCurrency, calculateDiscountedPrice } from '@/types/shop';
import { useToast } from '@/hooks/use-toast';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { FavoriteButton } from '@/components/portal/FavoriteButton';
const FahrzeugDetail: React.FC = () => {
  const { vehicleNumber } = useParams<{ vehicleNumber: string }>();
  const { user, loading } = useAuth();
  const { addVehicleToCart, vehicleItems } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addItem } = useRecentlyViewed();

  // Check if user is a guest (not logged in)
  const isGuest = !user;

  const isInCart = vehicle ? vehicleItems.some(item => item.vehicle.id === vehicle.id) : false;

  // Track recently viewed - we'll update this after we have the vehicle ID
  useEffect(() => {
    if (vehicle?.id) {
      addItem(vehicle.id, 'vehicle');
    }
  }, [vehicle?.id, addItem]);

  // Guest access allowed - no redirect for unauthenticated users

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleNumber) {
        setLoadingVehicle(false);
        return;
      }
      const { data, error } = await supabase
        .from('cars_for_sale')
        .select('*')
        .eq('vehicle_number', vehicleNumber)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        logError('FahrzeugDetail:fetchVehicle', error);
        toast({
          title: 'Fehler',
          description: 'Fahrzeug konnte nicht geladen werden.',
          variant: 'destructive',
        });
      } else if (data) {
        setVehicle(data as Vehicle);
      }

      setLoadingVehicle(false);
    };

    fetchVehicle();
  }, [vehicleNumber, toast]);

  const handleAddToCart = () => {
    if (!vehicle) return;
    const success = addVehicleToCart(vehicle);
    if (success) {
      toast({
        title: 'Zum Angebot hinzugefügt',
        description: `${vehicle.brand} ${vehicle.model} wurde zur Anfrage hinzugefügt.`,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatMileage = (km: number) => {
    return km.toLocaleString('de-DE') + ' km';
  };

  if (loading || loadingVehicle) {
    return (
      <PortalLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PortalLayout>
    );
  }

  if (!vehicle) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-16">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Fahrzeug nicht gefunden</h3>
              <p className="text-muted-foreground mb-4">
                Das gesuchte Fahrzeug existiert nicht oder ist nicht mehr verfügbar.
              </p>
              <Button asChild>
                <Link to="/portal">Zurück zum Portal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  const currentImage = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images[selectedImageIndex] 
    : null;

  const hasDiscount = (vehicle.discount_percentage ?? 0) > 0;
  const discountedPrice = hasDiscount 
    ? calculateDiscountedPrice(vehicle.price, vehicle.discount_percentage!)
    : vehicle.price;

  return (
    <PortalLayout showNav={!isGuest}>
      <div className="container mx-auto px-4 py-8">
        {/* Guest Banner */}
        {isGuest && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <UserPlus className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-amber-800 dark:text-amber-200">
                Registrieren Sie sich, um dieses Fahrzeug anzufragen.
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
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/portal')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {vehicle.is_sold && (
                  <Badge className="bg-destructive text-destructive-foreground">Verkauft</Badge>
                )}
                {vehicle.is_reserved && !vehicle.is_sold && (
                  <Badge className="bg-amber-500 text-white">Reserviert</Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
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
                  <Badge variant="outline" className="bg-background/80">
                    MwSt. ausweisbar
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {vehicle.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${vehicle.brand} ${vehicle.model} - Bild ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-muted-foreground">{vehicle.vehicle_type || 'Fahrzeug'}</p>
              {(vehicle as any).vehicle_number && (
                <p className="text-sm text-muted-foreground mt-1">Fzg.-Nr.: {(vehicle as any).vehicle_number}</p>
              )}
            </div>

            {/* Price */}
            <Card>
              <CardContent className="py-6">
                {hasDiscount ? (
                  <>
                    <p className="text-lg text-muted-foreground line-through">
                      {formatCurrency(vehicle.price)}
                    </p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(discountedPrice)}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(vehicle.price)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Netto{vehicle.vat_deductible && ' zzgl. 19% MwSt.'}
                </p>
                {vehicle.vat_deductible && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ MwSt. ausweisbar
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add to Cart Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => isGuest ? navigate('/portal/auth') : handleAddToCart()}
              disabled={vehicle.is_sold || isInCart || isGuest}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {isGuest
                ? 'Anmelden zum Anfragen'
                : vehicle.is_sold 
                  ? 'Nicht verfügbar' 
                  : isInCart 
                    ? 'Bereits im Angebot' 
                    : 'Zur Anfrage hinzufügen'}
            </Button>

            {/* Key Specs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fahrzeugdaten</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Erstzulassung</p>
                      <p className="font-medium">{formatDate(vehicle.first_registration_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Kilometerstand</p>
                      <p className="font-medium">{formatMileage(vehicle.mileage)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Kraftstoff</p>
                      <p className="font-medium">{vehicle.fuel_type || 'Keine Angabe'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Getriebe</p>
                      <p className="font-medium">{vehicle.transmission || 'Keine Angabe'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Leistung</p>
                      <p className="font-medium">{vehicle.power_hp ? `${vehicle.power_hp} PS` : 'Keine Angabe'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Farbe</p>
                      <p className="font-medium">{vehicle.color || 'Keine Angabe'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Vorbesitzer</p>
                      <p className="font-medium">{vehicle.previous_owners !== null ? vehicle.previous_owners : 'Keine Angabe'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {vehicle.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Beschreibung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">{vehicle.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ausstattung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {vehicle.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FahrzeugDetail;
