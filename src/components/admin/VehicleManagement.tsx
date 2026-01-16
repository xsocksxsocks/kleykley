import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Car, Bike, Truck, Upload, X, Star, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VEHICLE_BRANDS, VEHICLE_TYPE_LABELS } from '@/lib/vehicleBrands';

interface CarForSale {
  id: string;
  brand: string;
  model: string;
  first_registration_date: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  color: string | null;
  power_hp: number | null;
  previous_owners: number;
  price: number;
  description: string | null;
  description_en: string | null;
  features: string[] | null;
  features_en: string[] | null;
  images: string[];
  vehicle_type: string;
  vat_deductible: boolean;
  is_featured: boolean;
  is_sold: boolean;
  is_reserved: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const FUEL_TYPES = ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'Plug-in-Hybrid', 'Autogas (LPG)', 'Erdgas (CNG)', 'Wasserstoff'];
const TRANSMISSIONS = ['Schaltgetriebe', 'Automatik', 'Halbautomatik'];
const COLORS = ['Schwarz', 'Weiß', 'Silber', 'Grau', 'Blau', 'Rot', 'Grün', 'Gelb', 'Orange', 'Braun', 'Beige', 'Gold', 'Andere'];

const VehicleManagement: React.FC = () => {
  const { toast } = useToast();
  const [cars, setCars] = useState<CarForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarForSale | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadingImages, setUploadingImages] = useState(false);
  
  const [form, setForm] = useState({
    brand: '',
    model: '',
    first_registration_date: '',
    mileage: '',
    fuel_type: 'Benzin',
    transmission: 'Schaltgetriebe',
    color: '',
    power_hp: '',
    previous_owners: '1',
    price: '',
    description: '',
    description_en: '',
    features: '',
    features_en: '',
    images: [] as string[],
    vehicle_type: 'Fahrzeug',
    vat_deductible: false,
    is_featured: false,
    is_sold: false,
    is_reserved: false,
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars_for_sale')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCars((data as CarForSale[]) || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast({
        title: 'Fehler',
        description: 'Fahrzeuge konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCar(null);
    setForm({
      brand: '',
      model: '',
      first_registration_date: '',
      mileage: '',
      fuel_type: 'Benzin',
      transmission: 'Schaltgetriebe',
      color: '',
      power_hp: '',
      previous_owners: '1',
      price: '',
      description: '',
      description_en: '',
      features: '',
      features_en: '',
      images: [],
      vehicle_type: 'Fahrzeug',
      vat_deductible: false,
      is_featured: false,
      is_sold: false,
      is_reserved: false,
    });
  };

  const openEdit = (car: CarForSale) => {
    setEditingCar(car);
    setForm({
      brand: car.brand,
      model: car.model,
      first_registration_date: car.first_registration_date,
      mileage: car.mileage.toString(),
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      color: car.color || '',
      power_hp: car.power_hp?.toString() || '',
      previous_owners: car.previous_owners.toString(),
      price: car.price.toString(),
      description: car.description || '',
      description_en: car.description_en || '',
      features: car.features?.join('\n') || '',
      features_en: car.features_en?.join('\n') || '',
      images: car.images || [],
      vehicle_type: car.vehicle_type,
      vat_deductible: car.vat_deductible,
      is_featured: car.is_featured,
      is_sold: car.is_sold,
      is_reserved: car.is_reserved,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        newImageUrls.push(urlData.publicUrl);
      }

      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
      }));

      toast({
        title: 'Bilder hochgeladen',
        description: `${newImageUrls.length} Bild(er) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Fehler',
        description: 'Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      const carData = {
        brand: form.brand,
        model: form.model,
        first_registration_date: form.first_registration_date,
        mileage: parseInt(form.mileage),
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        color: form.color || null,
        power_hp: form.power_hp ? parseInt(form.power_hp) : null,
        previous_owners: parseInt(form.previous_owners) || 1,
        price: parseFloat(form.price),
        description: form.description || null,
        description_en: form.description_en || null,
        features: form.features ? form.features.split('\n').filter(f => f.trim()) : null,
        features_en: form.features_en ? form.features_en.split('\n').filter(f => f.trim()) : null,
        images: form.images,
        vehicle_type: form.vehicle_type,
        vat_deductible: form.vat_deductible,
        is_featured: form.is_featured,
        is_sold: form.is_sold,
        is_reserved: form.is_reserved,
      };

      if (editingCar) {
        const { error } = await supabase
          .from('cars_for_sale')
          .update(carData)
          .eq('id', editingCar.id);

        if (error) throw error;

        setCars((prev) =>
          prev.map((c) =>
            c.id === editingCar.id ? { ...c, ...carData } : c
          )
        );

        toast({
          title: 'Fahrzeug aktualisiert',
        });
      } else {
        const { data, error } = await supabase
          .from('cars_for_sale')
          .insert(carData)
          .select()
          .single();

        if (error) throw error;

        setCars((prev) => [data as CarForSale, ...prev]);

        toast({
          title: 'Fahrzeug erstellt',
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving car:', error);
      toast({
        title: 'Fehler',
        description: 'Fahrzeug konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (carId: string) => {
    if (!confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) return;

    try {
      // Soft delete
      const { error } = await supabase
        .from('cars_for_sale')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', carId);

      if (error) throw error;

      setCars((prev) => prev.filter((c) => c.id !== carId));

      toast({
        title: 'Fahrzeug gelöscht',
      });
    } catch (error) {
      console.error('Error deleting car:', error);
      toast({
        title: 'Fehler',
        description: 'Fahrzeug konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fahrzeug':
        return <Car className="h-4 w-4" />;
      case 'Motorrad':
        return <Bike className="h-4 w-4" />;
      case 'Baumaschine':
        return <Truck className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const filteredCars = filterType === 'all' 
    ? cars 
    : cars.filter((c) => c.vehicle_type === filterType);

  const getCurrentBrands = () => {
    switch (form.vehicle_type) {
      case 'Motorrad':
        return VEHICLE_BRANDS.motorrad;
      case 'Baumaschine':
        return VEHICLE_BRANDS.baumaschine;
      default:
        return VEHICLE_BRANDS.auto;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fahrzeugverwaltung</CardTitle>
        <div className="flex items-center gap-4">
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="Fahrzeug">Fahrzeuge</SelectItem>
              <SelectItem value="Motorrad">Motorräder</SelectItem>
              <SelectItem value="Baumaschine">Baumaschinen</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Fahrzeug hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCar ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[75vh] pr-4">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Grunddaten</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Typ *</Label>
                        <Select
                          value={form.vehicle_type}
                          onValueChange={(value) => setForm({ ...form, vehicle_type: value, brand: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fahrzeug">Fahrzeug</SelectItem>
                            <SelectItem value="Motorrad">Motorrad</SelectItem>
                            <SelectItem value="Baumaschine">Baumaschine</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Marke *</Label>
                        <Select
                          value={form.brand}
                          onValueChange={(value) => setForm({ ...form, brand: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Marke wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {getCurrentBrands().map((brand) => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Modell *</Label>
                        <Input
                          value={form.model}
                          onChange={(e) => setForm({ ...form, model: e.target.value })}
                          placeholder="z.B. A4 Avant"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Erstzulassung *</Label>
                        <Input
                          type="date"
                          value={form.first_registration_date}
                          onChange={(e) => setForm({ ...form, first_registration_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kilometerstand *</Label>
                        <Input
                          type="number"
                          value={form.mileage}
                          onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                          placeholder="z.B. 50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preis (€) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Technische Daten</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Kraftstoff *</Label>
                        <Select
                          value={form.fuel_type}
                          onValueChange={(value) => setForm({ ...form, fuel_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FUEL_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Getriebe *</Label>
                        <Select
                          value={form.transmission}
                          onValueChange={(value) => setForm({ ...form, transmission: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSMISSIONS.map((trans) => (
                              <SelectItem key={trans} value={trans}>{trans}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Leistung (PS)</Label>
                        <Input
                          type="number"
                          value={form.power_hp}
                          onChange={(e) => setForm({ ...form, power_hp: e.target.value })}
                          placeholder="z.B. 150"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Farbe</Label>
                        <Select
                          value={form.color}
                          onValueChange={(value) => setForm({ ...form, color: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Farbe wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map((color) => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vorbesitzer</Label>
                        <Input
                          type="number"
                          min="1"
                          value={form.previous_owners}
                          onChange={(e) => setForm({ ...form, previous_owners: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Bilder</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {form.images.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Bild ${index + 1}`}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {uploadingImages ? 'Wird hochgeladen...' : 'Bilder hochladen'}
                            </p>
                          </div>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                          />
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Beschreibung</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Beschreibung (DE)</Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Beschreibung (EN)</Label>
                        <Textarea
                          value={form.description_en}
                          onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Ausstattung (eine pro Zeile)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ausstattung (DE)</Label>
                        <Textarea
                          value={form.features}
                          onChange={(e) => setForm({ ...form, features: e.target.value })}
                          rows={4}
                          placeholder="Klimaanlage&#10;Navigationssystem&#10;LED-Scheinwerfer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ausstattung (EN)</Label>
                        <Textarea
                          value={form.features_en}
                          onChange={(e) => setForm({ ...form, features_en: e.target.value })}
                          rows={4}
                          placeholder="Air conditioning&#10;Navigation system&#10;LED headlights"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Flags */}
                  <div className="space-y-4">
                    <h3 className="font-medium border-b pb-2">Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>MwSt. ausweisbar</Label>
                        <Switch
                          checked={form.vat_deductible}
                          onCheckedChange={(checked) => setForm({ ...form, vat_deductible: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Empfohlen</Label>
                        <Switch
                          checked={form.is_featured}
                          onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Verkauft</Label>
                        <Switch
                          checked={form.is_sold}
                          onCheckedChange={(checked) => setForm({ ...form, is_sold: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Reserviert</Label>
                        <Switch
                          checked={form.is_reserved}
                          onCheckedChange={(checked) => setForm({ ...form, is_reserved: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={!form.brand || !form.model || !form.first_registration_date || !form.mileage || !form.price}
                  >
                    {editingCar ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCars.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Keine Fahrzeuge vorhanden.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Bild</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Marke / Modell</TableHead>
                <TableHead>EZ</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>
                    {car.images.length > 0 ? (
                      <img src={car.images[0]} alt={car.model} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(car.vehicle_type)}
                      <span className="text-sm">{car.vehicle_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {car.brand} {car.model}
                      {car.is_featured && (
                        <Star className="h-3 w-3 inline ml-1 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(car.first_registration_date).toLocaleDateString('de-DE', { month: '2-digit', year: 'numeric' })}
                  </TableCell>
                  <TableCell>{car.mileage.toLocaleString('de-DE')} km</TableCell>
                  <TableCell>
                    {car.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    {car.vat_deductible && (
                      <span className="text-xs text-muted-foreground block">MwSt. ausw.</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {car.is_sold ? (
                        <Badge variant="destructive" className="text-xs">Verkauft</Badge>
                      ) : car.is_reserved ? (
                        <Badge variant="secondary" className="text-xs">Reserviert</Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">Verfügbar</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(car)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(car.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleManagement;
