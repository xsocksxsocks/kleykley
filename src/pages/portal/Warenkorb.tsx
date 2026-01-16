import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { formatCurrency, calculateTax, calculateGrossPrice, calculateDiscountedPrice } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, Trash2, FileText, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Warenkorb: React.FC = () => {
  const { user, profile, isApproved } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  const [billingData, setBillingData] = useState({
    companyName: profile?.company_name || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postal_code || '',
  });
  const [shippingData, setShippingData] = useState({
    address: '',
    city: '',
    postalCode: '',
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile) {
      setBillingData({
        companyName: profile.company_name || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postal_code || '',
      });
    }
  }, [profile]);

  // Calculate totals with tax and discounts
  const calculateTotals = () => {
    let netTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    items.forEach((item) => {
      const originalPrice = item.product.price * item.quantity;
      const discountPercentage = (item.product as any).discount_percentage || 0;
      const discountedPrice = calculateDiscountedPrice(item.product.price, discountPercentage) * item.quantity;
      const itemTax = calculateTax(discountedPrice, item.product.tax_rate);
      
      discountTotal += originalPrice - discountedPrice;
      netTotal += discountedPrice;
      taxTotal += itemTax;
    });

    return {
      netTotal,
      taxTotal,
      discountTotal,
      grossTotal: netTotal + taxTotal,
    };
  };

  const totals = calculateTotals();

  const handleOrder = async () => {
    if (!user || !isApproved) {
      toast({
        title: 'Nicht berechtigt',
        description: 'Ihr Konto muss freigeschaltet sein, um Anfragen zu senden.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Keine Produkte ausgewählt',
        description: 'Fügen Sie Produkte hinzu, bevor Sie eine Anfrage senden.',
        variant: 'destructive',
      });
      return;
    }

    setIsOrdering(true);

    try {
      const orderData: any = {
        user_id: user.id,
        total_amount: totals.netTotal,
        company_name: billingData.companyName,
        billing_address: billingData.address,
        billing_city: billingData.city,
        billing_postal_code: billingData.postalCode,
        use_different_shipping: useDifferentShipping,
        shipping_address: useDifferentShipping ? shippingData.address : billingData.address,
        shipping_city: useDifferentShipping ? shippingData.city : billingData.city,
        shipping_postal_code: useDifferentShipping ? shippingData.postalCode : billingData.postalCode,
        notes: notes || null,
        order_number: '',
      };

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => {
        const discountPercentage = (item.product as any).discount_percentage || 0;
        const discountedUnitPrice = calculateDiscountedPrice(item.product.price, discountPercentage);
        return {
          order_id: createdOrder.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: discountedUnitPrice,
          total_price: discountedUnitPrice * item.quantity,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();
      toast({
        title: 'Anfrage gesendet!',
        description: `Ihre Angebotsanfrage ${createdOrder.order_number} wurde erfolgreich übermittelt.`,
      });
      navigate('/portal/anfragen');
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: 'Fehler',
        description: 'Die Anfrage konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsOrdering(false);
    }
  };

  if (items.length === 0 && !showCheckout) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Produkte ausgewählt</h3>
              <p className="text-muted-foreground mb-4">
                Wählen Sie Produkte aus, für die Sie ein Angebot anfordern möchten.
              </p>
              <Button asChild>
                <Link to="/portal">Zum Produktkatalog</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Angebotsanfrage</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const discountPercentage = (item.product as any).discount_percentage || 0;
              const discountedPrice = calculateDiscountedPrice(item.product.price, discountPercentage);
              const hasDiscount = discountPercentage > 0;
              
              return (
                <Card key={item.product.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.product.name}</h3>
                          {hasDiscount && (
                            <Badge className="bg-red-500 text-white text-xs">
                              -{discountPercentage}%
                            </Badge>
                          )}
                        </div>
                        {hasDiscount ? (
                          <>
                            <p className="text-muted-foreground text-sm line-through">
                              {formatCurrency(item.product.price)}
                            </p>
                            <p className="text-red-600 font-medium text-sm">
                              {formatCurrency(discountedPrice)} netto
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            {formatCurrency(item.product.price)} netto
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          zzgl. {item.product.tax_rate}% MwSt.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right w-28">
                        <p className={`font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
                          {formatCurrency(discountedPrice * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">netto</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ihr Angebot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Rabatt</span>
                      <span>-{formatCurrency(totals.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Zwischensumme (Netto)</span>
                    <span>{formatCurrency(totals.netTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>MwSt. (19%)</span>
                    <span>{formatCurrency(totals.taxTotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Gesamt (Brutto)</span>
                    <span>{formatCurrency(totals.grossTotal)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Die endgültigen Preise erhalten Sie in Ihrem individuellen Angebot.
                </p>

                {showCheckout && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Rechnungsadresse</h3>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firma</Label>
                      <Input
                        id="companyName"
                        value={billingData.companyName}
                        onChange={(e) => setBillingData({ ...billingData, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Straße und Hausnummer</Label>
                      <Input
                        id="billingAddress"
                        value={billingData.address}
                        onChange={(e) => setBillingData({ ...billingData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="billingPostal">PLZ</Label>
                        <Input
                          id="billingPostal"
                          value={billingData.postalCode}
                          onChange={(e) => setBillingData({ ...billingData, postalCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">Stadt</Label>
                        <Input
                          id="billingCity"
                          value={billingData.city}
                          onChange={(e) => setBillingData({ ...billingData, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="differentShipping"
                        checked={useDifferentShipping}
                        onCheckedChange={(checked) => setUseDifferentShipping(checked as boolean)}
                      />
                      <Label htmlFor="differentShipping" className="text-sm">
                        Abweichende Lieferadresse
                      </Label>
                    </div>

                    {useDifferentShipping && (
                      <div className="space-y-4 pl-6 border-l-2">
                        <h4 className="font-medium">Lieferadresse</h4>
                        <div className="space-y-2">
                          <Label htmlFor="shippingAddress">Straße und Hausnummer</Label>
                          <Input
                            id="shippingAddress"
                            value={shippingData.address}
                            onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="shippingPostal">PLZ</Label>
                            <Input
                              id="shippingPostal"
                              value={shippingData.postalCode}
                              onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingCity">Stadt</Label>
                            <Input
                              id="shippingCity"
                              value={shippingData.city}
                              onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes">Nachricht / Anforderungen</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Besondere Wünsche oder Anforderungen..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                {showCheckout ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleOrder}
                      disabled={isOrdering || !billingData.address || !billingData.city || !billingData.postalCode}
                    >
                      {isOrdering ? 'Wird gesendet...' : 'Angebotsanfrage senden'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowCheckout(false)}
                    >
                      Zurück
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => setShowCheckout(true)}>
                    Weiter zur Anfrage
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Warenkorb;
