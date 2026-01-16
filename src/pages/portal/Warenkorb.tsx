import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart, Vehicle } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { formatCurrency, calculateTax, calculateDiscountedPrice } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Minus, Plus, Trash2, FileText, Car, Tag, X, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EU_COUNTRIES } from '@/lib/countries';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
}

const Warenkorb: React.FC = () => {
  const { user, profile, isApproved, isAdmin, loading } = useAuth();
  const { items, vehicleItems, updateQuantity, removeFromCart, removeVehicleFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect non-approved users
  useEffect(() => {
    if (!loading && user && !isApproved && !isAdmin) {
      navigate('/portal');
    }
  }, [loading, user, isApproved, isAdmin, navigate]);
  
  const [isOrdering, setIsOrdering] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [useDifferentShipping, setUseDifferentShipping] = useState(false);
  const [billingData, setBillingData] = useState({
    customerName: profile?.full_name || '',
    companyName: profile?.company_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    postalCode: profile?.postal_code || '',
    country: (profile as any)?.country || 'Deutschland',
  });
  const [shippingData, setShippingData] = useState({
    customerName: '',
    companyName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
  });
  const [notes, setNotes] = useState('');
  
  // Discount code state
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    if (profile) {
      setBillingData({
        customerName: profile.full_name || '',
        companyName: profile.company_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postal_code || '',
        country: profile.country || 'Deutschland',
      });
    }
  }, [profile]);

  // Calculate totals with tax and discounts
  const calculateTotals = () => {
    let netTotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    // Products
    items.forEach((item) => {
      const originalPrice = item.product.price * item.quantity;
      const discountPercentage = (item.product as any).discount_percentage || 0;
      const discountedPrice = calculateDiscountedPrice(item.product.price, discountPercentage) * item.quantity;
      const itemTax = calculateTax(discountedPrice, item.product.tax_rate);
      
      discountTotal += originalPrice - discountedPrice;
      netTotal += discountedPrice;
      taxTotal += itemTax;
    });

    // Vehicles (assume 19% tax for vehicles with vat_deductible)
    vehicleItems.forEach((item) => {
      const originalPrice = item.vehicle.price;
      const discountPercentage = item.vehicle.discount_percentage || 0;
      const discountedPrice = calculateDiscountedPrice(item.vehicle.price, discountPercentage);
      const itemTax = item.vehicle.vat_deductible ? calculateTax(discountedPrice, 19) : 0;
      
      discountTotal += originalPrice - discountedPrice;
      netTotal += discountedPrice;
      taxTotal += itemTax;
    });

    // Apply discount code
    let codeDiscount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.discount_type === 'percentage') {
        codeDiscount = netTotal * (appliedDiscount.discount_value / 100);
      } else {
        codeDiscount = Math.min(appliedDiscount.discount_value, netTotal);
      }
    }

    const finalNetTotal = netTotal - codeDiscount;
    const finalTaxTotal = finalNetTotal * 0.19; // Recalculate tax on discounted total

    return {
      netTotal: finalNetTotal,
      taxTotal: finalTaxTotal,
      discountTotal,
      codeDiscount,
      grossTotal: finalNetTotal + finalTaxTotal,
    };
  };

  const totals = calculateTotals();

  // Validate discount code
  const handleApplyDiscountCode = async () => {
    if (!discountCodeInput.trim()) return;

    setIsValidatingCode(true);
    setDiscountError('');

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCodeInput.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setDiscountError('Ungültiger Rabattcode');
        return;
      }

      // Check validity
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if (now < validFrom) {
        setDiscountError('Dieser Code ist noch nicht gültig');
        return;
      }

      if (validUntil && now > validUntil) {
        setDiscountError('Dieser Code ist abgelaufen');
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setDiscountError('Dieser Code wurde bereits zu oft verwendet');
        return;
      }

      // Calculate current net total for min order check
      let currentNetTotal = 0;
      items.forEach((item) => {
        const discountPercentage = (item.product as any).discount_percentage || 0;
        currentNetTotal += calculateDiscountedPrice(item.product.price, discountPercentage) * item.quantity;
      });
      vehicleItems.forEach((item) => {
        const discountPercentage = item.vehicle.discount_percentage || 0;
        currentNetTotal += calculateDiscountedPrice(item.vehicle.price, discountPercentage);
      });

      if (data.min_order_value && currentNetTotal < data.min_order_value) {
        setDiscountError(`Mindestbestellwert: ${formatCurrency(data.min_order_value)}`);
        return;
      }

      setAppliedDiscount(data as DiscountCode);
      setDiscountCodeInput('');
      toast({
        title: 'Rabattcode angewendet',
        description: data.discount_type === 'percentage' 
          ? `${data.discount_value}% Rabatt` 
          : `${formatCurrency(data.discount_value)} Rabatt`,
      });
    } catch (error) {
      console.error('Error validating discount code:', error);
      setDiscountError('Fehler bei der Validierung');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountError('');
  };

  // Validate name has at least two words
  const isValidName = (name: string) => name.trim().split(/\s+/).length >= 2;
  
  const isBillingComplete = isValidName(billingData.customerName) && billingData.companyName && billingData.phone && 
    billingData.address && billingData.city && billingData.postalCode && billingData.country;
  
  const isShippingComplete = !useDifferentShipping || (
    isValidName(shippingData.customerName) && shippingData.companyName && shippingData.phone &&
    shippingData.address && shippingData.city && shippingData.postalCode && shippingData.country
  );
  
  // Get validation error messages
  const getBillingNameError = () => {
    if (!billingData.customerName) return '';
    if (!isValidName(billingData.customerName)) return 'Bitte Vor- und Nachname eingeben (z.B. Max Mustermann)';
    return '';
  };
  
  const getShippingNameError = () => {
    if (!shippingData.customerName) return '';
    if (!isValidName(shippingData.customerName)) return 'Bitte Vor- und Nachname eingeben (z.B. Max Mustermann)';
    return '';
  };

  const handleOrder = async () => {
    if (!user || !isApproved) {
      toast({
        title: 'Nicht berechtigt',
        description: 'Ihr Konto muss freigeschaltet sein, um Anfragen zu senden.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0 && vehicleItems.length === 0) {
      toast({
        title: 'Keine Artikel ausgewählt',
        description: 'Fügen Sie Produkte oder Fahrzeuge hinzu, bevor Sie eine Anfrage senden.',
        variant: 'destructive',
      });
      return;
    }

    setIsOrdering(true);

    try {
      const orderData: any = {
        user_id: user.id,
        total_amount: totals.netTotal,
        customer_name: billingData.customerName,
        company_name: billingData.companyName,
        phone: billingData.phone,
        billing_address: billingData.address,
        billing_city: billingData.city,
        billing_postal_code: billingData.postalCode,
        billing_country: billingData.country,
        use_different_shipping: useDifferentShipping,
        shipping_customer_name: useDifferentShipping ? shippingData.customerName : billingData.customerName,
        shipping_company_name: useDifferentShipping ? shippingData.companyName : billingData.companyName,
        shipping_phone: useDifferentShipping ? shippingData.phone : billingData.phone,
        shipping_address: useDifferentShipping ? shippingData.address : billingData.address,
        shipping_city: useDifferentShipping ? shippingData.city : billingData.city,
        shipping_postal_code: useDifferentShipping ? shippingData.postalCode : billingData.postalCode,
        shipping_country: useDifferentShipping ? shippingData.country : billingData.country,
        notes: notes || null,
        order_number: '',
        discount_code_id: appliedDiscount?.id || null,
        discount_amount: totals.codeDiscount || 0,
      };

      const { data: createdOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Product items
      const productOrderItems = items.map((item) => {
        const discountPercentage = (item.product as any).discount_percentage || 0;
        const discountedUnitPrice = calculateDiscountedPrice(item.product.price, discountPercentage);
        return {
          order_id: createdOrder.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: discountedUnitPrice,
          total_price: discountedUnitPrice * item.quantity,
          original_unit_price: item.product.price,
          discount_percentage: discountPercentage,
        };
      });

      // Vehicle items (stored with product_id = null, name prefixed with [FAHRZEUG])
      const vehicleOrderItems = vehicleItems.map((item) => {
        const discountPercentage = item.vehicle.discount_percentage || 0;
        const discountedUnitPrice = calculateDiscountedPrice(item.vehicle.price, discountPercentage);
        return {
          order_id: createdOrder.id,
          product_id: null,
          product_name: `[FAHRZEUG] ${item.vehicle.brand} ${item.vehicle.model}`,
          quantity: 1,
          unit_price: discountedUnitPrice,
          total_price: discountedUnitPrice,
          original_unit_price: item.vehicle.price,
          discount_percentage: discountPercentage,
        };
      });

      const allOrderItems = [...productOrderItems, ...vehicleOrderItems];

      if (allOrderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(allOrderItems);

        if (itemsError) throw itemsError;
      }

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

  const hasItems = items.length > 0 || vehicleItems.length > 0;

  if (!hasItems && !showCheckout) {
    return (
      <PortalLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Artikel ausgewählt</h3>
              <p className="text-muted-foreground mb-4">
                Wählen Sie Produkte oder Fahrzeuge aus, für die Sie ein Angebot anfordern möchten.
              </p>
              <Button asChild>
                <Link to="/portal">Zum Katalog</Link>
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
                          <Badge variant="outline" className="text-xs">Ware</Badge>
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
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={item.product.stock_quantity > 0 ? item.product.stock_quantity : undefined}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxVal = item.product.stock_quantity > 0 ? item.product.stock_quantity : val;
                            updateQuantity(item.product.id, Math.max(1, Math.min(val, maxVal)));
                          }}
                          className="w-16 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.product.stock_quantity > 0 && item.quantity >= item.product.stock_quantity}
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
            
            {/* Vehicle Items */}
            {vehicleItems.map((item) => {
              const discountPercentage = item.vehicle.discount_percentage || 0;
              const discountedPrice = calculateDiscountedPrice(item.vehicle.price, discountPercentage);
              const hasDiscount = discountPercentage > 0;
              
              return (
                <Card key={item.vehicle.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {item.vehicle.images && item.vehicle.images.length > 0 ? (
                        <img
                          src={item.vehicle.images[0]}
                          alt={`${item.vehicle.brand} ${item.vehicle.model}`}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.vehicle.brand} {item.vehicle.model}</h3>
                          <Badge variant="outline">{item.vehicle.vehicle_type || 'Fahrzeug'}</Badge>
                          {hasDiscount && (
                            <Badge className="bg-red-500 text-white text-xs">
                              -{discountPercentage}%
                            </Badge>
                          )}
                        </div>
                        {hasDiscount ? (
                          <>
                            <p className="text-muted-foreground text-sm line-through">
                              {formatCurrency(item.vehicle.price)}
                            </p>
                            <p className="text-red-600 font-medium text-sm">
                              {formatCurrency(discountedPrice)} {item.vehicle.vat_deductible ? 'netto' : 'brutto'}
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            {formatCurrency(item.vehicle.price)} {item.vehicle.vat_deductible ? 'netto' : 'brutto'}
                          </p>
                        )}
                      </div>
                      <div className="text-right w-28">
                        <p className={`font-bold ${hasDiscount ? 'text-red-600' : ''}`}>
                          {formatCurrency(discountedPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.vehicle.vat_deductible ? 'netto' : 'brutto'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVehicleFromCart(item.vehicle.id)}
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
                {/* Discount Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="discountCode" className="text-sm font-medium">Rabattcode</Label>
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-mono font-medium">{appliedDiscount.code}</span>
                        <Badge className="bg-green-500 text-white">
                          {appliedDiscount.discount_type === 'percentage' 
                            ? `-${appliedDiscount.discount_value}%` 
                            : `-${formatCurrency(appliedDiscount.discount_value)}`}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveDiscountCode}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="discountCode"
                          value={discountCodeInput}
                          onChange={(e) => {
                            setDiscountCodeInput(e.target.value.toUpperCase());
                            setDiscountError('');
                          }}
                          placeholder="Code eingeben"
                          className="pl-10 font-mono"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyDiscountCode();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleApplyDiscountCode}
                        disabled={!discountCodeInput.trim() || isValidatingCode}
                        variant="outline"
                      >
                        {isValidatingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Einlösen'
                        )}
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-sm text-destructive">{discountError}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  {totals.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Produktrabatte</span>
                      <span>-{formatCurrency(totals.discountTotal)}</span>
                    </div>
                  )}
                  {totals.codeDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Rabattcode ({appliedDiscount?.code})</span>
                      <span>-{formatCurrency(totals.codeDiscount)}</span>
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
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="customerName">Vor- und Nachname *</Label>
                        <Input
                          id="customerName"
                          value={billingData.customerName}
                          onChange={(e) => setBillingData({ ...billingData, customerName: e.target.value })}
                          placeholder="Max Mustermann"
                        />
                        {getBillingNameError() && (
                          <p className="text-sm text-destructive">{getBillingNameError()}</p>
                        )}
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="companyName">Firma *</Label>
                        <Input
                          id="companyName"
                          value={billingData.companyName}
                          onChange={(e) => setBillingData({ ...billingData, companyName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={billingData.phone}
                        onChange={(e) => setBillingData({ ...billingData, phone: e.target.value })}
                        placeholder="+49 123 456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingAddress">Straße und Hausnummer *</Label>
                      <Input
                        id="billingAddress"
                        value={billingData.address}
                        onChange={(e) => setBillingData({ ...billingData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="billingPostal">PLZ *</Label>
                        <Input
                          id="billingPostal"
                          value={billingData.postalCode}
                          onChange={(e) => setBillingData({ ...billingData, postalCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">Stadt *</Label>
                        <Input
                          id="billingCity"
                          value={billingData.city}
                          onChange={(e) => setBillingData({ ...billingData, city: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">Land *</Label>
                      <Select
                        value={billingData.country}
                        onValueChange={(value) => setBillingData({ ...billingData, country: value })}
                      >
                        <SelectTrigger id="billingCountry">
                          <SelectValue placeholder="Land wählen" />
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
                          <Label htmlFor="shippingCustomerName">Vor- und Nachname *</Label>
                          <Input
                            id="shippingCustomerName"
                            value={shippingData.customerName}
                            onChange={(e) => setShippingData({ ...shippingData, customerName: e.target.value })}
                            placeholder="Max Mustermann"
                          />
                          {getShippingNameError() && (
                            <p className="text-sm text-destructive">{getShippingNameError()}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingCompanyName">Firma *</Label>
                          <Input
                            id="shippingCompanyName"
                            value={shippingData.companyName}
                            onChange={(e) => setShippingData({ ...shippingData, companyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingPhone">Telefon *</Label>
                          <Input
                            id="shippingPhone"
                            type="tel"
                            value={shippingData.phone}
                            onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                            placeholder="+49 123 456789"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingAddress">Straße und Hausnummer *</Label>
                          <Input
                            id="shippingAddress"
                            value={shippingData.address}
                            onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="shippingPostal">PLZ *</Label>
                            <Input
                              id="shippingPostal"
                              value={shippingData.postalCode}
                              onChange={(e) => setShippingData({ ...shippingData, postalCode: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shippingCity">Stadt *</Label>
                            <Input
                              id="shippingCity"
                              value={shippingData.city}
                              onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingCountry">Land *</Label>
                          <Select
                            value={shippingData.country}
                            onValueChange={(value) => setShippingData({ ...shippingData, country: value })}
                          >
                            <SelectTrigger id="shippingCountry">
                              <SelectValue placeholder="Land wählen" />
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
                      disabled={isOrdering || !isBillingComplete || !isShippingComplete}
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
