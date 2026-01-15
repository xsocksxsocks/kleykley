import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Product, Order, OrderItem } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  ArrowLeft,
  Users,
  Package,
  FileText,
  Check,
  X,
  Clock,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  Image,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductImageUpload } from '@/components/admin/ProductImageUpload';

interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  profiles?: Profile;
}

const Admin: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  
  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock_quantity: '',
    is_active: true,
  });
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedProductForImages, setSelectedProductForImages] = useState<Product | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/portal');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isAdmin) return;

      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (customersError) throw customersError;
        setCustomers((customersData as Profile[]) || []);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts((productsData as Product[]) || []);

        // Fetch orders with items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*),
            profiles (*)
          `)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders((ordersData as OrderWithItems[]) || []);
      } catch (error) {
        console.error('Error fetching data:', error);
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
      fetchData();
    }
  }, [user, isAdmin, toast]);

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

  const handleSaveProduct = async () => {
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description || null,
        price: parseFloat(productForm.price),
        image_url: productForm.image_url || null,
        category: productForm.category || null,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        is_active: productForm.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...p, ...productData } : p
          )
        );

        toast({
          title: 'Produkt aktualisiert',
          description: 'Das Produkt wurde erfolgreich aktualisiert.',
        });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData as any)
          .select()
          .single();

        if (error) throw error;

        setProducts((prev) => [data as Product, ...prev]);

        toast({
          title: 'Produkt erstellt',
          description: 'Das Produkt wurde erfolgreich erstellt.',
        });
      }

      setProductDialogOpen(false);
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Fehler',
        description: 'Produkt konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Möchten Sie dieses Produkt wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== productId));

      toast({
        title: 'Produkt gelöscht',
        description: 'Das Produkt wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Fehler',
        description: 'Produkt konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );

      toast({
        title: 'Status aktualisiert',
        description: `Anfrage wurde auf "${statusLabels[status]}" gesetzt.`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '',
      stock_quantity: '',
      is_active: true,
    });
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category || '',
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
    });
    setProductDialogOpen(true);
  };

  const openImageDialog = async (product: Product) => {
    setSelectedProductForImages(product);
    
    // Fetch images for this product
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });
    
    if (!error && data) {
      setProductImages(data as ProductImage[]);
    } else {
      setProductImages([]);
    }
    
    setImageDialogOpen(true);
  };

  const triggerAutoApproval = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-auto-approvals');
      
      if (error) throw error;

      toast({
        title: 'Freischaltung ausgeführt',
        description: `${data.approved_count} Kunden wurden freigeschaltet.`,
      });

      // Refresh customers list
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

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingCustomers = customers.filter((c) => c.approval_status === 'pending');
  const pendingOrders = orders.filter((o) => o.status === 'pending');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/portal">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingCustomers.length > 0 && (
              <Badge variant="destructive">{pendingCustomers.length} wartend</Badge>
            )}
            {pendingOrders.length > 0 && (
              <Badge variant="secondary">{pendingOrders.length} neue Anfragen</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kunden
              {pendingCustomers.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingCustomers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produkte
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Anfragen
              {pendingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kundenverwaltung</CardTitle>
                <Button variant="outline" size="sm" onClick={triggerAutoApproval}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Zeitgesteuerte Freischaltung ausführen
                </Button>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : customers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Kunden vorhanden.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Registriert</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">
                            {customer.full_name || '-'}
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>
                            {new Date(customer.registered_at).toLocaleDateString('de-DE')}
                          </TableCell>
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
                            {customer.approval_status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveCustomer(customer.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Freischalten
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectCustomer(customer.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produktverwaltung</CardTitle>
                <Dialog open={productDialogOpen} onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (!open) resetProductForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Produkt hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={productForm.name}
                          onChange={(e) =>
                            setProductForm({ ...productForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({ ...productForm, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Preis (€) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({ ...productForm, price: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock">Verfügbar</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock_quantity}
                            onChange={(e) =>
                              setProductForm({ ...productForm, stock_quantity: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Kategorie</Label>
                        <Input
                          id="category"
                          value={productForm.category}
                          onChange={(e) =>
                            setProductForm({ ...productForm, category: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image">Bild-URL</Label>
                        <Input
                          id="image"
                          value={productForm.image_url}
                          onChange={(e) =>
                            setProductForm({ ...productForm, image_url: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="active">Aktiv</Label>
                        <Switch
                          id="active"
                          checked={productForm.is_active}
                          onCheckedChange={(checked) =>
                            setProductForm({ ...productForm, is_active: checked })
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleSaveProduct}
                        disabled={!productForm.name || !productForm.price}
                      >
                        {editingProduct ? 'Speichern' : 'Erstellen'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Produkte vorhanden.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Preis</TableHead>
                        <TableHead>Verfügbar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category || '-'}</TableCell>
                          <TableCell>
                            {product.price.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openImageDialog(product)}
                                title="Bilder verwalten"
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id)}
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
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Angebotsanfragen</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Anfragen vorhanden.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Anfrage-Nr.</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Geschätzter Wert</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {order.profiles?.full_name || order.profiles?.email || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('de-DE')}
                          </TableCell>
                          <TableCell>
                            {order.total_amount.toLocaleString('de-DE', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[order.status]}>
                              {statusLabels[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <Link to={`/admin/anfrage/${order.id}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Link>
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  handleUpdateOrderStatus(order.id, value as Order['status'])
                                }
                              >
                                <SelectTrigger className="w-40">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Image Management Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Bilder verwalten: {selectedProductForImages?.name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {selectedProductForImages && (
                <ProductImageUpload
                  productId={selectedProductForImages.id}
                  images={productImages}
                  onImagesChange={setProductImages}
                />
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;
