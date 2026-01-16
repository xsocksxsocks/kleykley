import React, { useEffect, useState } from 'react';
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
import { Plus, Edit, Trash2, Car, Bike, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VEHICLE_BRANDS, VEHICLE_TYPE_LABELS, VehicleType } from '@/lib/vehicleBrands';

interface Vehicle {
  id: string;
  name: string;
  description: string | null;
  vehicle_type: VehicleType;
  brand: string;
  model: string | null;
  year: number | null;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VehicleManagement: React.FC = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filterType, setFilterType] = useState<VehicleType | 'all'>('all');
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    vehicle_type: 'auto' as VehicleType,
    brand: '',
    model: '',
    year: '',
    price: '',
    stock_quantity: '',
    is_active: true,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles((data as Vehicle[]) || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
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
    setEditingVehicle(null);
    setForm({
      name: '',
      description: '',
      vehicle_type: 'auto',
      brand: '',
      model: '',
      year: '',
      price: '',
      stock_quantity: '',
      is_active: true,
    });
  };

  const openEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      name: vehicle.name,
      description: vehicle.description || '',
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand,
      model: vehicle.model || '',
      year: vehicle.year?.toString() || '',
      price: vehicle.price.toString(),
      stock_quantity: vehicle.stock_quantity.toString(),
      is_active: vehicle.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const vehicleData = {
        name: form.name,
        description: form.description || null,
        vehicle_type: form.vehicle_type,
        brand: form.brand,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity) || 0,
        is_active: form.is_active,
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;

        setVehicles((prev) =>
          prev.map((v) =>
            v.id === editingVehicle.id ? { ...v, ...vehicleData } : v
          )
        );

        toast({
          title: 'Fahrzeug aktualisiert',
          description: 'Das Fahrzeug wurde erfolgreich aktualisiert.',
        });
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select()
          .single();

        if (error) throw error;

        setVehicles((prev) => [data as Vehicle, ...prev]);

        toast({
          title: 'Fahrzeug erstellt',
          description: 'Das Fahrzeug wurde erfolgreich erstellt.',
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        title: 'Fehler',
        description: 'Fahrzeug konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

      toast({
        title: 'Fahrzeug gelöscht',
        description: 'Das Fahrzeug wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: 'Fehler',
        description: 'Fahrzeug konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: VehicleType) => {
    switch (type) {
      case 'auto':
        return <Car className="h-4 w-4" />;
      case 'motorrad':
        return <Bike className="h-4 w-4" />;
      case 'baumaschine':
        return <Truck className="h-4 w-4" />;
    }
  };

  const filteredVehicles = filterType === 'all' 
    ? vehicles 
    : vehicles.filter((v) => v.vehicle_type === filterType);

  const currentBrands = VEHICLE_BRANDS[form.vehicle_type];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fahrzeugverwaltung</CardTitle>
        <div className="flex items-center gap-4">
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as VehicleType | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="auto">Fahrzeuge</SelectItem>
              <SelectItem value="motorrad">Motorräder</SelectItem>
              <SelectItem value="baumaschine">Baumaschinen</SelectItem>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Typ *</Label>
                    <Select
                      value={form.vehicle_type}
                      onValueChange={(value) => {
                        setForm({ 
                          ...form, 
                          vehicle_type: value as VehicleType,
                          brand: '' // Reset brand when type changes
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Typ wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Fahrzeug</SelectItem>
                        <SelectItem value="motorrad">Motorrad</SelectItem>
                        <SelectItem value="baumaschine">Baumaschine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marke *</Label>
                    <Select
                      value={form.brand}
                      onValueChange={(value) => setForm({ ...form, brand: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Marke wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Bezeichnung *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="z.B. BMW 3er Limousine"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Modell</Label>
                      <Input
                        id="model"
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value })}
                        placeholder="z.B. 320d"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Baujahr</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        placeholder="z.B. 2023"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Technische Details, Ausstattung, Zustand..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preis (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Verfügbar</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={form.stock_quantity}
                        onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Aktiv</Label>
                    <Switch
                      id="active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={!form.name || !form.brand || !form.price}
                  >
                    {editingVehicle ? 'Speichern' : 'Erstellen'}
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
        ) : filteredVehicles.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Keine Fahrzeuge vorhanden.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Marke</TableHead>
                <TableHead>Bezeichnung</TableHead>
                <TableHead>Modell</TableHead>
                <TableHead>Baujahr</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Verfügbar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(vehicle.vehicle_type)}
                      <span className="text-sm">{VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{vehicle.brand}</TableCell>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.model || '-'}</TableCell>
                  <TableCell>{vehicle.year || '-'}</TableCell>
                  <TableCell>
                    {vehicle.price.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </TableCell>
                  <TableCell>{vehicle.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                      {vehicle.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(vehicle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(vehicle.id)}
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
