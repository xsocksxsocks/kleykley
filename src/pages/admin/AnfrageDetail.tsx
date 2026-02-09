import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { Profile, Order, OrderItem, formatCurrency, calculateGrossPrice } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Package,
  Car,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderHistorySection } from '@/components/admin/OrderHistorySection';
import { OrderNotesSection } from '@/components/admin/OrderNotesSection';

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

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
}

interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  profiles: Profile;
  admin_notes?: string | null;
  admin_notes_updated_at?: string | null;
  discount_code_id?: string | null;
  discount_amount?: number | null;
  discount_codes?: DiscountCode | null;
}

const AnfrageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/portal');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !isAdmin || !id) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*),
            profiles (*),
            discount_codes (id, code, discount_type, discount_value)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        
        if (!data) {
          toast({
            title: 'Fehler',
            description: 'Anfrage nicht gefunden.',
            variant: 'destructive',
          });
          navigate('/admin');
          return;
        }

        setOrder(data as OrderWithDetails);
      } catch (error) {
        logError('AnfrageDetail:fetchOrder', error);
        toast({
          title: 'Fehler',
          description: 'Daten konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user && isAdmin) {
      fetchOrder();
    }
  }, [user, isAdmin, id, toast, navigate]);

  const handleUpdateStatus = async (status: Order['status']) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id);

      if (error) throw error;

      setOrder((prev) => prev ? { ...prev, status } : null);

      // Send email notification to customer
      const statusToNotificationType: Record<Order['status'], string> = {
        pending: '',
        confirmed: 'order_confirmed',
        processing: 'order_processing',
        shipped: 'order_shipped',
        delivered: 'order_delivered',
        cancelled: 'order_cancelled',
      };

      const notificationType = statusToNotificationType[status];
      if (notificationType && order.profiles?.email) {
        try {
          await supabase.functions.invoke('send-customer-notification', {
            body: {
              type: notificationType,
              customerEmail: order.profiles.email,
              customerName: order.profiles.full_name || order.profiles.company_name || 'Kunde',
              data: {
                orderNumber: order.order_number,
              },
            },
          });
          console.log('Order status notification email sent');
        } catch (emailError) {
          console.error('Failed to send order status notification:', emailError);
        }
      }

      toast({
        title: 'Status aktualisiert',
        description: `Anfrage wurde auf "${statusLabels[status]}" gesetzt. E-Mail wurde gesendet.`,
      });
    } catch (error) {
      logError('AnfrageDetail:updateStatus', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Anfrage nicht gefunden.</p>
      </div>
    );
  }

  const customer = order.profiles;
  const netTotal = order.total_amount;
  // Calculate estimated gross with 19% VAT
  const grossTotal = calculateGrossPrice(netTotal, 19);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Admin Panel
              </Link>
            </Button>
          </div>
          <Badge className={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Anfrage {order.order_number}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleUpdateStatus(value as Order['status'])}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Neu</SelectItem>
                      <SelectItem value="confirmed">Angebot erstellt</SelectItem>
                      <SelectItem value="processing">In Bearbeitung</SelectItem>
                      <SelectItem value="shipped">Versendet</SelectItem>
                      <SelectItem value="delivered">Abgeschlossen</SelectItem>
                      <SelectItem value="cancelled">Storniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Angefragte Produkte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produkt</TableHead>
                      <TableHead className="text-right">Menge</TableHead>
                      <TableHead className="text-right">Netto-Preis</TableHead>
                      <TableHead className="text-right">Gesamt (Netto)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.order_items.map((item) => {
                      const hasDiscount = (item.discount_percentage ?? 0) > 0;
                      const isVehicle = item.product_name.startsWith('[FAHRZEUG]');
                      const displayName = isVehicle 
                        ? item.product_name.replace('[FAHRZEUG] ', '') 
                        : item.product_name;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isVehicle ? (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  Fahrzeug
                                </Badge>
                              ) : (
                                <Badge variant="outline">Ware</Badge>
                              )}
                              {displayName}
                              {hasDiscount && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  -{item.discount_percentage}%
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {hasDiscount && item.original_unit_price ? (
                              <div>
                                <span className="text-muted-foreground line-through text-xs block">
                                  {formatCurrency(item.original_unit_price)}
                                </span>
                                <span className="text-red-600">{formatCurrency(item.unit_price)}</span>
                              </div>
                            ) : (
                              formatCurrency(item.unit_price)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2">
                  {/* Subtotal before discount */}
                  {order.discount_codes && order.discount_amount && order.discount_amount > 0 ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Zwischensumme Netto</span>
                        <span>{formatCurrency(netTotal + order.discount_amount)}</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30">
                            {order.discount_codes.code}
                          </Badge>
                          <span>
                            {order.discount_codes.discount_type === 'percentage' 
                              ? `${order.discount_codes.discount_value}% Rabatt`
                              : `${formatCurrency(order.discount_codes.discount_value)} Rabatt`}
                          </span>
                        </span>
                        <span>-{formatCurrency(order.discount_amount)}</span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between text-lg">
                    <span>Summe Netto</span>
                    <span className="font-semibold">{formatCurrency(netTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>zzgl. 19% MwSt.</span>
                    <span>{formatCurrency(grossTotal - netTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Gesamt Brutto</span>
                    <span>{formatCurrency(grossTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Bemerkungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {order.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Order History */}
            <OrderHistorySection orderId={order.id} />

            {/* Admin Notes - Thread-style */}
            <OrderNotesSection orderId={order.id} />
          </div>

          {/* Sidebar - Customer Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kundeninformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer?.full_name || '-'}</p>
                </div>

                {(order.company_name || customer?.company_name) && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Firma</p>
                      <p className="font-medium">{order.company_name || customer?.company_name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-Mail</p>
                    <a href={`mailto:${customer?.email}`} className="font-medium text-primary hover:underline">
                      {customer?.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    {(order as any).phone || customer?.phone ? (
                      <a href={`tel:${(order as any).phone || customer?.phone}`} className="font-medium text-primary hover:underline">
                        {(order as any).phone || customer?.phone}
                      </a>
                    ) : (
                      <p className="text-muted-foreground">-</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Registriert am</p>
                  <p className="font-medium">
                    {customer?.registered_at
                      ? new Date(customer.registered_at).toLocaleDateString('de-DE')
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Konto-Status</p>
                  <Badge
                    variant={
                      customer?.approval_status === 'approved'
                        ? 'default'
                        : customer?.approval_status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {customer?.approval_status === 'approved'
                      ? 'Freigeschaltet'
                      : customer?.approval_status === 'rejected'
                      ? 'Abgelehnt'
                      : 'Wartend'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Rechnungsadresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {order.company_name && (
                    <p className="font-medium">{order.company_name}</p>
                  )}
                  <p>{customer?.full_name}</p>
                  <p>{order.billing_address || customer?.address || '-'}</p>
                  <p>
                    {order.billing_postal_code || customer?.postal_code}{' '}
                    {order.billing_city || customer?.city}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.use_different_shipping && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Abweichende Lieferadresse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p>{order.shipping_address || '-'}</p>
                    <p>
                      {order.shipping_postal_code} {order.shipping_city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnfrageDetail;
