import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { Order, OrderItem, formatCurrency } from '@/types/shop';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<Order['status'], string> = {
  pending: 'In Bearbeitung',
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

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const Anfragen: React.FC = () => {
  const { user, loading, isApproved, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
    // Redirect non-approved users
    if (!loading && user && !isApproved && !isAdmin) {
      navigate('/portal');
    }
  }, [user, loading, isApproved, isAdmin, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logError('Anfragen:fetchOrders', error);
        toast({
          title: 'Fehler',
          description: 'Anfragen konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } else {
        setOrders((data as OrderWithItems[]) || []);
      }
      setLoadingOrders(false);
    };

    if (user) {
      fetchOrders();
    }
  }, [user, toast]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Meine Anfragen</h1>

        {loadingOrders ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Anfragen</h3>
              <p className="text-muted-foreground mb-4">
                Sie haben noch keine Angebotsanfragen gesendet.
              </p>
              <Button asChild>
                <Link to="/portal">Zum Produktkatalog</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-base">{order.order_number}</CardTitle>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(order.total_amount)} netto
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedOrder === order.id && (
                  <CardContent className="border-t pt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Angefragte Produkte</h4>
                        <div className="space-y-2">
                          {order.order_items.map((item) => {
                            const hasDiscount = item.discount_percentage !== null && 
                                               item.discount_percentage !== undefined && 
                                               item.discount_percentage > 0;
                            return (
                              <div key={item.id} className="flex justify-between text-sm items-center">
                                <div className="flex items-center gap-2">
                                  <span>{item.quantity}x {item.product_name}</span>
                                  {hasDiscount && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      -{item.discount_percentage}%
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  {hasDiscount && item.original_unit_price ? (
                                    <>
                                      <span className="text-muted-foreground line-through text-xs mr-2">
                                        {formatCurrency(item.original_unit_price * item.quantity)}
                                      </span>
                                      <span className="text-red-600 font-medium">
                                        {formatCurrency(item.total_price)} netto
                                      </span>
                                    </>
                                  ) : (
                                    <span>{formatCurrency(item.total_price)} netto</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {order.company_name && (
                        <div>
                          <h4 className="font-medium mb-2">Firma</h4>
                          <p className="text-sm text-muted-foreground">{order.company_name}</p>
                        </div>
                      )}
                      {order.shipping_address && (
                        <div>
                          <h4 className="font-medium mb-2">Lieferadresse</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.shipping_address}<br />
                            {order.shipping_postal_code} {order.shipping_city}
                          </p>
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Ihre Nachricht</h4>
                          <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Anfragen;
