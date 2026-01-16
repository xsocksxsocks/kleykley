import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { Profile, Order, OrderItem } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  X,
  Clock,
  RefreshCw,
  Edit,
  Eye,
  FileText,
  Search,
  TrendingUp,
  Calendar,
  Euro,
  Ban,
  ShieldCheck,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EU_COUNTRIES } from '@/lib/countries';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// UserDocument interface removed - documents feature no longer used

interface CustomerManagementProps {
  customers: Profile[];
  setCustomers: React.Dispatch<React.SetStateAction<Profile[]>>;
  loadingData: boolean;
}

const statusLabels: Record<Order['status'], string> = {
  pending: 'Neu',
  confirmed: 'Angebot erstellt',
  processing: 'In Bearbeitung',
  shipped: 'Versendet',
  delivered: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  processing: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  shipped: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  delivered: 'bg-green-500/20 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

// documentTypeLabels removed - documents feature no longer used

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  setCustomers,
  loadingData,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [customerOrders, setCustomerOrders] = useState<OrderWithItems[]>([]);
  // Documents feature removed - state no longer needed
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    company_name: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
  });

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.company_name?.toLowerCase().includes(query)
    );
  });

  const handleApproveCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, approval_status: 'approved', approved_at: new Date().toISOString() }
            : c
        )
      );

      toast({
        title: 'Kunde freigeschaltet',
        description: 'Der Kunde kann jetzt im Portal Anfragen senden.',
      });
    } catch (error) {
      console.error('Error approving customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht freigeschaltet werden.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: 'rejected' })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, approval_status: 'rejected' } : c
        )
      );

      toast({
        title: 'Kunde abgelehnt',
        description: 'Der Kunde wurde abgelehnt.',
      });
    } catch (error) {
      console.error('Error rejecting customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht abgelehnt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleChangeStatus = async (customerId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const updateData: { approval_status: typeof newStatus; approved_at?: string | null } = {
        approval_status: newStatus,
      };
      
      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      } else {
        updateData.approved_at = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, approval_status: newStatus, approved_at: updateData.approved_at || null }
            : c
        )
      );

      // Send email notification
      const notificationType = newStatus === 'approved' ? 'status_approved' : 
                               newStatus === 'rejected' ? 'status_rejected' : 'status_pending';
      
      try {
        await supabase.functions.invoke('send-customer-notification', {
          body: {
            type: notificationType,
            customerEmail: customer.email,
            customerName: customer.full_name || customer.company_name || 'Kunde',
          },
        });
        console.log('Status notification email sent');
      } catch (emailError) {
        console.error('Failed to send status notification email:', emailError);
      }

      const statusLabels = {
        pending: 'Wartend',
        approved: 'Freigeschaltet',
        rejected: 'Abgelehnt',
      };

      toast({
        title: 'Status geändert',
        description: `Kundenstatus auf "${statusLabels[newStatus]}" gesetzt. E-Mail wurde gesendet.`,
      });
    } catch (error) {
      console.error('Error changing customer status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht geändert werden.',
        variant: 'destructive',
      });
    }
  };

  const triggerAutoApproval = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-auto-approvals');

      if (error) throw error;

      toast({
        title: 'Freischaltung ausgeführt',
        description: `${data.approved_count} Kunden wurden freigeschaltet.`,
      });

      const { data: customersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersData) {
        setCustomers(customersData as Profile[]);
      }
    } catch (error) {
      console.error('Error triggering auto-approval:', error);
      toast({
        title: 'Fehler',
        description: 'Freischaltung konnte nicht ausgeführt werden.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (customer: Profile) => {
    setSelectedCustomer(customer);
    setEditForm({
      full_name: customer.full_name || '',
      email: customer.email,
      company_name: customer.company_name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'Deutschland',
    });
    setEditDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name || null,
          company_name: editForm.company_name || null,
          phone: editForm.phone || null,
          address: editForm.address || null,
          city: editForm.city || null,
          postal_code: editForm.postal_code || null,
          country: editForm.country || null,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                full_name: editForm.full_name || null,
                company_name: editForm.company_name || null,
                phone: editForm.phone || null,
                address: editForm.address || null,
                city: editForm.city || null,
                postal_code: editForm.postal_code || null,
                country: editForm.country || null,
              }
            : c
        )
      );

      toast({
        title: 'Kunde aktualisiert',
        description: 'Die Kundendaten wurden gespeichert.',
      });

      setEditDialogOpen(false);
    } catch (error) {
      logError('CustomerManagement:updateCustomer', error);
      toast({
        title: 'Fehler',
        description: 'Kundendaten konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const openHistoryDialog = async (customer: Profile) => {
    setSelectedCustomer(customer);
    setHistoryDialogOpen(true);
    setLoadingHistory(true);

    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`*, order_items (*)`)
        .eq('user_id', customer.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setCustomerOrders((ordersData as OrderWithItems[]) || []);

      // Documents feature removed - no longer fetching documents
    } catch (error) {
      logError('CustomerManagement:fetchHistory', error);
      toast({
        title: 'Fehler',
        description: 'Kundenhistorie konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleBlock = async (customer: Profile) => {
    if (customer.is_blocked) {
      // Unblock immediately
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_blocked: false,
            blocked_at: null,
            blocked_reason: null,
          })
          .eq('id', customer.id);

        if (error) throw error;

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === customer.id
              ? { ...c, is_blocked: false, blocked_at: null, blocked_reason: null }
              : c
          )
        );

        toast({
          title: 'Kunde entsperrt',
          description: `${customer.full_name || customer.company_name || 'Kunde'} wurde entsperrt.`,
        });
      } catch (error) {
        console.error('Error unblocking customer:', error);
        toast({
          title: 'Fehler',
          description: 'Kunde konnte nicht entsperrt werden.',
          variant: 'destructive',
        });
      }
    } else {
      // Open dialog to block with reason
      setSelectedCustomer(customer);
      setBlockReason('');
      setBlockDialogOpen(true);
    }
  };

  const handleConfirmBlock = async () => {
    if (!selectedCustomer) return;

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_at: now,
          blocked_reason: blockReason || null,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? { ...c, is_blocked: true, blocked_at: now, blocked_reason: blockReason || null }
            : c
        )
      );

      toast({
        title: 'Kunde gesperrt',
        description: `${selectedCustomer.full_name || selectedCustomer.company_name || 'Kunde'} wurde gesperrt.`,
      });

      setBlockDialogOpen(false);
    } catch (error) {
      console.error('Error blocking customer:', error);
      toast({
        title: 'Fehler',
        description: 'Kunde konnte nicht gesperrt werden.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle>Kundenverwaltung</CardTitle>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={triggerAutoApproval}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Zeitgesteuerte Freischaltung
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Keine Kunden gefunden.' : 'Keine Kunden vorhanden.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Registriert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className={customer.is_blocked ? 'bg-red-500/5' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {customer.full_name || '-'}
                        {customer.is_blocked && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            Gesperrt
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.company_name || '-'}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{formatDate(customer.registered_at)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.approval_status === 'approved'
                            ? 'default'
                            : customer.approval_status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {customer.approval_status === 'approved' && (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {customer.approval_status === 'rejected' && (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {customer.approval_status === 'pending' && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {customer.approval_status === 'approved'
                          ? 'Freigeschaltet'
                          : customer.approval_status === 'rejected'
                          ? 'Abgelehnt'
                          : 'Wartend'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Select
                          value={customer.approval_status}
                          onValueChange={(value: 'pending' | 'approved' | 'rejected') => 
                            handleChangeStatus(customer.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Wartend
                              </div>
                            </SelectItem>
                            <SelectItem value="approved">
                              <div className="flex items-center gap-2">
                                <Check className="h-3 w-3" />
                                Freigeschaltet
                              </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                              <div className="flex items-center gap-2">
                                <X className="h-3 w-3" />
                                Abgelehnt
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant={customer.is_blocked ? 'default' : 'outline'}
                          onClick={() => handleToggleBlock(customer)}
                          title={customer.is_blocked ? 'Entsperren' : 'Sperren'}
                          className={customer.is_blocked ? 'bg-green-600 hover:bg-green-700' : 'text-red-600 hover:text-red-700'}
                        >
                          {customer.is_blocked ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(customer)}
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistoryDialog(customer)}
                          title="Historie"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Name</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Firma</Label>
                <Input
                  id="company_name"
                  value={editForm.company_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail (nur lesbar)</Label>
              <Input id="email" value={editForm.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                E-Mail-Adresse kann aus Sicherheitsgründen nicht geändert werden.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">PLZ</Label>
                <Input
                  id="postal_code"
                  value={editForm.postal_code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, postal_code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm({ ...editForm, city: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Select
                value={editForm.country}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, country: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EU_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSaveCustomer}>
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              Kundenhistorie: {selectedCustomer?.company_name || selectedCustomer?.full_name || selectedCustomer?.email}
            </DialogTitle>
          </DialogHeader>
          
          {/* Customer Statistics */}
          {!loadingHistory && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs font-medium">Anfragen</span>
                </div>
                <p className="text-xl font-bold">{customerOrders.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Euro className="h-4 w-4" />
                  <span className="text-xs font-medium">Gesamtumsatz</span>
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Ø Bestellwert</span>
                </div>
                <p className="text-xl font-bold">
                  {customerOrders.length > 0 
                    ? formatCurrency(customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / customerOrders.length)
                    : formatCurrency(0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Letzte Aktivität</span>
                </div>
                <p className="text-sm font-bold">
                  {customerOrders.length > 0 
                    ? formatDate(customerOrders[0].created_at)
                    : selectedCustomer?.created_at 
                      ? formatDate(selectedCustomer.created_at)
                      : '-'}
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="orders" className="w-full">
            <TabsList>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Anfragen ({customerOrders.length})
              </TabsTrigger>
            </TabsList>
            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="orders" className="mt-0">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Anfragen vorhanden.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anfrage-Nr.</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Artikel</TableHead>
                        <TableHead>Wert</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>{order.order_items.length} Artikel</TableCell>
                          <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Block Customer Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Kunde sperren
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Möchten Sie <strong>{selectedCustomer?.full_name || selectedCustomer?.company_name || 'diesen Kunden'}</strong> sperren?
              Gesperrte Kunden können sich nicht mehr anmelden und keine Anfragen senden.
            </p>
            <div className="space-y-2">
              <Label htmlFor="block_reason">Grund (optional)</Label>
              <Textarea
                id="block_reason"
                placeholder="Grund für die Sperrung..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBlockDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmBlock}
              >
                <Ban className="h-4 w-4 mr-2" />
                Sperren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerManagement;
