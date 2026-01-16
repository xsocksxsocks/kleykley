import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Car, Star, Mail, Phone, Calendar, Gauge, Fuel, Settings, Users, Palette, Check } from 'lucide-react';
import { formatCurrency } from '@/types/shop';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
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
}

const FahrzeugDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isApproved, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!id || (!isApproved && !isAdmin)) {
        setLoadingVehicle(false);
        return;
      }

      const { data, error } = await supabase
        .from('cars_for_sale')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vehicle:', error);
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

    if (user) {
      fetchVehicle();
    }
  }, [id, user, isApproved, isAdmin, toast]);

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

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
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
              {(vehicle.is_featured || vehicle.is_reserved || vehicle.is_sold) && (
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {vehicle.is_featured && (
                    <Badge className="bg-gold text-navy-dark flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Empfohlen
                    </Badge>
                  )}
                  {vehicle.is_reserved && (
                    <Badge className="bg-amber-500 text-white">Reserviert</Badge>
                  )}
                  {vehicle.is_sold && (
                    <Badge className="bg-red-500 text-white">Verkauft</Badge>
                  )}
                </div>
              )}
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
            </div>

            {/* Price */}
            <Card>
              <CardContent className="py-6">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(vehicle.price)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.vat_deductible ? 'Netto zzgl. MwSt. (MwSt. ausweisbar)' : 'Brutto inkl. MwSt.'}
                </p>
              </CardContent>
            </Card>

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
                      <p className="font-medium">{vehicle.fuel_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Getriebe</p>
                      <p className="font-medium">{vehicle.transmission}</p>
                    </div>
                  </div>
                  {vehicle.power_hp && (
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Leistung</p>
                        <p className="font-medium">{vehicle.power_hp} PS</p>
                      </div>
                    </div>
                  )}
                  {vehicle.color && (
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Farbe</p>
                        <p className="font-medium">{vehicle.color}</p>
                      </div>
                    </div>
                  )}
                  {vehicle.previous_owners !== null && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Vorbesitzer</p>
                        <p className="font-medium">{vehicle.previous_owners}</p>
                      </div>
                    </div>
                  )}
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

            {/* Contact CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6">
                <h3 className="font-semibold mb-2">Interesse an diesem Fahrzeug?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Kontaktieren Sie uns für ein unverbindliches Angebot oder weitere Informationen.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1">
                    <a href="mailto:info@kley.de?subject=Anfrage%20{vehicle.brand}%20{vehicle.model}">
                      <Mail className="h-4 w-4 mr-2" />
                      E-Mail senden
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <a href="tel:+4912345678">
                      <Phone className="h-4 w-4 mr-2" />
                      Anrufen
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default FahrzeugDetail;
