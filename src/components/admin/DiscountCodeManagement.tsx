import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Edit, Trash2, Copy, Percent, Euro } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const DiscountCodeManagement: React.FC = () => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '0',
    max_uses: '',
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data as DiscountCode[]) || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast({
        title: 'Fehler',
        description: 'Rabattcodes konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCode(null);
    setForm({
      code: generateRandomCode(),
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_value: '0',
      max_uses: '',
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: '',
      is_active: true,
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (code: DiscountCode) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      min_order_value: code.min_order_value.toString(),
      max_uses: code.max_uses?.toString() || '',
      valid_from: code.valid_from.slice(0, 16),
      valid_until: code.valid_until?.slice(0, 16) || '',
      is_active: code.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      toast({
        title: 'Fehler',
        description: 'Bitte Code und Rabattwert angeben.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_value: parseFloat(form.min_order_value) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: form.is_active,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(data)
          .eq('id', editingCode.id);

        if (error) throw error;

        setCodes((prev) =>
          prev.map((c) => (c.id === editingCode.id ? { ...c, ...data } : c))
        );

        toast({
          title: 'Rabattcode aktualisiert',
          description: `Code "${data.code}" wurde gespeichert.`,
        });
      } else {
        const { data: newCode, error } = await supabase
          .from('discount_codes')
          .insert(data)
          .select()
          .single();

        if (error) throw error;

        setCodes((prev) => [newCode as DiscountCode, ...prev]);

        toast({
          title: 'Rabattcode erstellt',
          description: `Code "${data.code}" wurde erstellt.`,
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving discount code:', error);
      toast({
        title: 'Fehler',
        description: error.message?.includes('duplicate')
          ? 'Dieser Code existiert bereits.'
          : 'Rabattcode konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Rabattcode wirklich löschen?')) return;

    try {
      const { error } = await supabase.from('discount_codes').delete().eq('id', id);

      if (error) throw error;

      setCodes((prev) => prev.filter((c) => c.id !== id));

      toast({
        title: 'Rabattcode gelöscht',
      });
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast({
        title: 'Fehler',
        description: 'Rabattcode konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code kopiert',
      description: `"${code}" wurde in die Zwischenablage kopiert.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const isCodeValid = (code: DiscountCode) => {
    const now = new Date();
    const validFrom = new Date(code.valid_from);
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;
    
    if (!code.is_active) return false;
    if (now < validFrom) return false;
    if (validUntil && now > validUntil) return false;
    if (code.max_uses && code.current_uses >= code.max_uses) return false;
    
    return true;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Rabattcodes</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Rabattcode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Rabattcode bearbeiten' : 'Neuer Rabattcode'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="z.B. SOMMER20"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForm({ ...form, code: generateRandomCode() })}
                  >
                    Generieren
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="z.B. Sommeraktion 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Rabattart</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setForm({ ...form, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Prozentual (%)</SelectItem>
                      <SelectItem value="fixed">Festbetrag (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Rabattwert * {form.discount_type === 'percentage' ? '(%)' : '(€)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={form.discount_type === 'percentage' ? '100' : undefined}
                    step={form.discount_type === 'percentage' ? '1' : '0.01'}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Mindestbestellwert (€)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max. Nutzungen (leer = unbegrenzt)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Gültig ab *</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Gültig bis (leer = unbegrenzt)</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Aktiv</Label>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSave}
                disabled={!form.code.trim() || !form.discount_value}
              >
                {editingCode ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : codes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Keine Rabattcodes vorhanden.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Rabatt</TableHead>
                <TableHead>Mindestbestellwert</TableHead>
                <TableHead>Gültigkeit</TableHead>
                <TableHead>Nutzungen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{code.code}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(code.code)}
                        title="Code kopieren"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {code.description && (
                      <p className="text-xs text-muted-foreground">{code.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {code.discount_type === 'percentage' ? (
                        <>
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span>{code.discount_value}%</span>
                        </>
                      ) : (
                        <>
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(code.discount_value)}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {code.min_order_value > 0
                      ? formatCurrency(code.min_order_value)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Ab: {formatDate(code.valid_from)}</div>
                      {code.valid_until && (
                        <div className="text-muted-foreground">
                          Bis: {formatDate(code.valid_until)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {code.current_uses}
                    {code.max_uses && ` / ${code.max_uses}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isCodeValid(code) ? 'default' : 'secondary'}
                      className={isCodeValid(code) ? 'bg-green-500' : ''}
                    >
                      {isCodeValid(code) ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(code)}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(code.id)}
                        title="Löschen"
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

export default DiscountCodeManagement;
