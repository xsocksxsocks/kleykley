import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react';
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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const Anfragen: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/portal/auth');
    }
  }, [user, loading, navigate]);

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
        console.error('Error fetching orders:', error);
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link to="/portal">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Portal
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                          ca. {order.total_amount.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
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
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span>
                                ca. {item.total_price.toLocaleString('de-DE', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
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
      </main>
    </div>
  );
};

export default Anfragen;
