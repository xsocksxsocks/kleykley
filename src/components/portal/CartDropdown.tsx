import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, calculateDiscountedPrice } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, Trash2, Package, Plus, Minus, Car } from 'lucide-react';

export const CartDropdown: React.FC = () => {
  const { items, vehicleItems, totalItems, totalPrice, removeFromCart, removeVehicleFromCart, updateQuantity } = useCart();

  const hasItems = items.length > 0 || vehicleItems.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold relative"
        >
          <ShoppingCart className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Warenkorb</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-1 sm:ml-2 bg-gold text-navy-dark">
              {totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-background border border-border shadow-lg z-50"
      >
        {!hasItems ? (
          <div className="p-6 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Ihr Warenkorb ist leer</p>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto">
              {/* Products */}
              {items.map((item) => {
                const discountPercentage = item.product.discount_percentage || 0;
                const discountedPrice = calculateDiscountedPrice(item.product.price, discountPercentage);
                
                return (
                  <div key={item.product.id} className="p-3 border-b border-border last:border-b-0">
                    <div className="flex items-start gap-3">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">Ware</Badge>
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(discountedPrice)} / Stück
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(item.product.id, item.quantity - 1);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(item.product.id, item.quantity + 1);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              removeFromCart(item.product.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(discountedPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Vehicles */}
              {vehicleItems.map((item) => {
                const discountPercentage = item.vehicle.discount_percentage || 0;
                const discountedPrice = calculateDiscountedPrice(item.vehicle.price, discountPercentage);
                
                return (
                  <div key={item.vehicle.id} className="p-3 border-b border-border last:border-b-0">
                    <div className="flex items-start gap-3">
                      {item.vehicle.images && item.vehicle.images.length > 0 ? (
                        <img
                          src={item.vehicle.images[0]}
                          alt={`${item.vehicle.brand} ${item.vehicle.model}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.vehicle.brand} {item.vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.vehicle.vehicle_type || 'Fahrzeug'}
                        </p>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">1x Fahrzeug</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              removeVehicleFromCart(item.vehicle.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(discountedPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <DropdownMenuSeparator />
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Gesamt (Netto)</span>
                <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
              </div>
              <Button asChild className="w-full">
                <Link to="/portal/warenkorb">
                  Zur Angebotsanfrage
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
