import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
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
  Tag,
  Car,
  LayoutDashboard,
  Search,
  Percent,
  Download,
  Upload,
  ChevronDown,
  Loader2,
  Mail,
  FileDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ProductImageUpload } from '@/components/admin/ProductImageUpload';
import VehicleManagement from '@/components/admin/VehicleManagement';
import AdminDashboard from '@/components/admin/AdminDashboard';

import { CustomerManagement } from '@/components/admin/CustomerManagement';
import { DiscountCodeManagement } from '@/components/admin/DiscountCodeManagement';
import { BulkProductImporter } from '@/components/admin/BulkProductImporter';
import { EmailLogViewer } from '@/components/admin/EmailLogViewer';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { exportCatalogToPDF } from '@/lib/pdfExport';

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
  pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  processing: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  shipped: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  delivered: 'bg-green-500/20 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  profiles?: Profile;
}

// Component to display product thumbnail from product_images
const ProductThumbnail: React.FC<{ productId: string; fallbackUrl?: string | null }> = ({ productId, fallbackUrl }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMainImage = async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();
      
      if (!error && data) {
        setImageUrl(data.image_url);
      } else if (fallbackUrl) {
        setImageUrl(fallbackUrl);
      }
      setLoading(false);
    };
    
    fetchMainImage();
  }, [productId, fallbackUrl]);

  if (loading) {
    return <div className="w-10 h-10 bg-muted rounded animate-pulse" />;
  }

  if (!imageUrl) {
    return (
      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img src={imageUrl} alt="Produkt" className="w-10 h-10 object-cover rounded" />
  );
};

const Admin: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [pdfExporting, setPdfExporting] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    is_active: true,
    is_recommended: false,
    discount_percentage: '',
  });
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  
  // Categories state
  const [categories, setCategories] = useState<{ id: string; name: string; sort_order: number; parent_id: string | null }[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // JSON Import Preview state
  const [jsonImportPreviewOpen, setJsonImportPreviewOpen] = useState(false);
  const [jsonImportData, setJsonImportData] = useState<any[]>([]);
  const [jsonImporting, setJsonImporting] = useState(false);

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

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

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
        logError('Admin:fetchData', error);
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
        category_id: productForm.category_id || null,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        is_active: productForm.is_active,
        is_recommended: productForm.is_recommended,
        discount_percentage: parseFloat(productForm.discount_percentage) || 0,
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
      logError('Admin:saveProduct', error);
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
      logError('Admin:deleteProduct', error);
      toast({
        title: 'Fehler',
        description: 'Produkt konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      // First get the order with customer details
      const order = orders.find(o => o.id === orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );

      // Send email notification to customer
      if (order) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, full_name, company_name')
          .eq('id', order.user_id)
          .maybeSingle();

        if (profileData?.email) {
          const statusToNotificationType: Record<Order['status'], string> = {
            pending: '',
            confirmed: 'order_confirmed',
            processing: 'order_processing',
            shipped: 'order_shipped',
            delivered: 'order_delivered',
            cancelled: 'order_cancelled',
          };

          const notificationType = statusToNotificationType[status];
          if (notificationType) {
            try {
              await supabase.functions.invoke('send-customer-notification', {
                body: {
                  type: notificationType,
                  customerEmail: profileData.email,
                  customerName: profileData.full_name || profileData.company_name || 'Kunde',
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
        }
      }

      toast({
        title: 'Status aktualisiert',
        description: `Anfrage wurde auf "${statusLabels[status]}" gesetzt. E-Mail wurde gesendet.`,
      });
    } catch (error) {
      logError('Admin:updateOrderStatus', error);
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
      category_id: '',
      stock_quantity: '',
      is_active: true,
      is_recommended: false,
      discount_percentage: '',
    });
    setProductImages([]);
  };

  const openEditProduct = async (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: (product as any).category_id || '',
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
      is_recommended: (product as any).is_recommended || false,
      discount_percentage: ((product as any).discount_percentage || 0).toString(),
    });
    
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
    
    setProductDialogOpen(true);
  };

  const openNewProduct = () => {
    resetProductForm();
    setProductDialogOpen(true);
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim(), sort_order: categories.length })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategoryName('');
      setCategoryDialogOpen(false);

      toast({
        title: 'Kategorie erstellt',
        description: `"${data.name}" wurde hinzugefügt.`,
      });
    } catch (error: any) {
      logError('Admin:addCategory', error);
      toast({
        title: 'Fehler',
        description: error.message?.includes('duplicate') 
          ? 'Diese Kategorie existiert bereits.' 
          : 'Kategorie konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.filter((c) => c.id !== categoryId));

      toast({
        title: 'Kategorie gelöscht',
        description: 'Die Kategorie wurde entfernt.',
      });
    } catch (error) {
      logError('Admin:deleteCategory', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return '-';
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || '-';
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
            <Button
              variant="outline"
              onClick={async () => {
                setPdfExporting(true);
                try {
                  await exportCatalogToPDF();
                  toast({
                    title: 'PDF Export erfolgreich',
                    description: 'Der Katalog wurde heruntergeladen.',
                  });
                } catch (error) {
                  console.error('PDF export error:', error);
                  toast({
                    title: 'Fehler',
                    description: 'PDF konnte nicht erstellt werden.',
                    variant: 'destructive',
                  });
                } finally {
                  setPdfExporting(false);
                }
              }}
              disabled={pdfExporting}
            >
              {pdfExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              PDF Katalog
            </Button>
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
          <TabsList className="mb-8 w-full flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
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
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Kategorien
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Fahrzeuge
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Anfragen
              {pendingOrders.length > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="discounts" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Rabattcodes
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard orders={orders} />
          </TabsContent>

          <TabsContent value="customers">
            <CustomerManagement
              customers={customers}
              setCustomers={setCustomers}
              loadingData={loadingData}
            />
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produktverwaltung</CardTitle>
                <div className="flex items-center gap-2">
                  {/* CSV Export for Invoice Platform */}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Build CSV with invoice platform format
                      const headers = [
                        'Artikelnummer',
                        'Name',
                        'Einheit',
                        'Bestand',
                        'Bestand aktiviert',
                        'Umsatzsteuer',
                        'Einkaufspreis',
                        'Verkaufspreis',
                        'Kategorie',
                        'Ober-Kategorie',
                        'Beschreibung'
                      ];
                      
                      const rows = products.map(p => {
                        const category = categories.find(c => c.id === (p as any).category_id);
                        const parentCategory = category?.parent_id 
                          ? categories.find(c => c.id === category.parent_id) 
                          : null;
                        return [
                          p.product_number || '',
                          p.name,
                          'Stück', // Default unit
                          p.stock_quantity.toString(),
                          p.is_active ? 'Ja' : 'Nein',
                          `${p.tax_rate}%`,
                          '', // Einkaufspreis - not stored
                          p.price.toFixed(2).replace('.', ','),
                          category?.name || '',
                          parentCategory?.name || '',
                          (p.description || '').replace(/"/g, '""') // Escape quotes
                        ];
                      });
                      
                      // Build CSV content with proper escaping
                      const csvContent = [
                        headers.join(';'),
                        ...rows.map(row => 
                          row.map(cell => {
                            // Wrap in quotes if contains semicolon, newline, or quotes
                            if (cell.includes(';') || cell.includes('\n') || cell.includes('"')) {
                              return `"${cell}"`;
                            }
                            return cell;
                          }).join(';')
                        )
                      ].join('\n');
                      
                      // Add BOM for Excel UTF-8 compatibility
                      const bom = '\uFEFF';
                      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `produkte-export-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast({ 
                        title: 'CSV Export erfolgreich', 
                        description: `${products.length} Produkte für Rechnungsplattform exportiert.` 
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        JSON
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {
                        // Enhanced export with category names
                        const exportData = products.map(p => {
                          const category = categories.find(c => c.id === (p as any).category_id);
                          const parentCategory = category?.parent_id 
                            ? categories.find(c => c.id === category.parent_id) 
                            : null;
                          return {
                            name: p.name,
                            description: p.description,
                            price: p.price,
                            category_name: category?.name || null,
                            parent_category_name: parentCategory?.name || null,
                            stock_quantity: p.stock_quantity,
                            is_active: p.is_active,
                            is_recommended: (p as any).is_recommended,
                            discount_percentage: (p as any).discount_percentage,
                            tax_rate: p.tax_rate,
                          };
                        });
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `produkte-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'Export erfolgreich', description: `${products.length} Produkte exportiert.` });
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportieren
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'application/json';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const importedProducts = JSON.parse(text);
                            if (!Array.isArray(importedProducts)) {
                              toast({ title: 'Fehler', description: 'Ungültiges JSON-Format.', variant: 'destructive' });
                              return;
                            }
                            setJsonImportData(importedProducts);
                            setJsonImportPreviewOpen(true);
                          } catch (err) {
                            toast({ title: 'Fehler', description: 'JSON konnte nicht gelesen werden.', variant: 'destructive' });
                          }
                        };
                        input.click();
                      }}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importieren
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Dialog open={productDialogOpen} onOpenChange={(open) => {
                    setProductDialogOpen(open);
                    if (!open) resetProductForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetProductForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Produkt hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[70vh] pr-4">
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
                          <Select
                            value={productForm.category_id || "none"}
                            onValueChange={(value) =>
                              setProductForm({ ...productForm, category_id: value === "none" ? "" : value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Keine Kategorie</SelectItem>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="recommended">Empfohlen</Label>
                          <Switch
                            id="recommended"
                            checked={productForm.is_recommended}
                            onCheckedChange={(checked) =>
                              setProductForm({ ...productForm, is_recommended: checked })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discount">Rabatt (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            placeholder="0"
                            value={productForm.discount_percentage}
                            onChange={(e) =>
                              setProductForm({ ...productForm, discount_percentage: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Prozentualer Rabatt auf den Verkaufspreis (0-100%)
                          </p>
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
                        
                        {/* Image Upload Section */}
                        {editingProduct && (
                          <div className="border-t pt-4">
                            <ProductImageUpload
                              productId={editingProduct.id}
                              images={productImages}
                              onImagesChange={setProductImages}
                            />
                          </div>
                        )}
                        
                        <Button
                          className="w-full"
                          onClick={handleSaveProduct}
                          disabled={!productForm.name || !productForm.price}
                        >
                          {editingProduct ? 'Speichern' : 'Erstellen'}
                        </Button>
                      </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Category Filter */}
                <div className="mb-4 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px] max-w-[400px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Produkte suchen..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {productSearchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setProductSearchQuery('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Kategorie:</span>
                    <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Alle Kategorien" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        <SelectItem value="no_category">⚠️ Ohne Kategorie</SelectItem>
                        {categories.filter(c => c.parent_id === null).map(parent => (
                          <React.Fragment key={parent.id}>
                            <SelectItem value={`parent_${parent.id}`} className="font-semibold">
                              {parent.name}
                            </SelectItem>
                            {categories.filter(c => c.parent_id === parent.id).map(sub => (
                              <SelectItem key={sub.id} value={sub.id} className="pl-6">
                                └ {sub.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {productCategoryFilter === 'no_category' && (
                    <Badge variant="destructive">
                      {products.filter(p => !(p as any).category_id).length} Produkte ohne Kategorie
                    </Badge>
                  )}
                  {productSearchQuery && (
                    <Badge variant="secondary">
                      {products.filter(p => {
                        const searchLower = productSearchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(searchLower) ||
                          (p.description?.toLowerCase().includes(searchLower)) ||
                          (p.product_number?.toLowerCase().includes(searchLower));
                      }).length} Treffer
                    </Badge>
                  )}
                </div>
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
                        <TableHead className="w-16">Bild</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Preis</TableHead>
                        <TableHead>Verfügbar</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.filter((product) => {
                        // First apply search filter
                        if (productSearchQuery) {
                          const searchLower = productSearchQuery.toLowerCase();
                          const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                            (product.description?.toLowerCase().includes(searchLower)) ||
                            (product.product_number?.toLowerCase().includes(searchLower));
                          if (!matchesSearch) return false;
                        }
                        // Then apply category filter
                        if (productCategoryFilter === 'all') return true;
                        if (productCategoryFilter === 'no_category') return !(product as any).category_id;
                        if (productCategoryFilter.startsWith('parent_')) {
                          const parentId = productCategoryFilter.replace('parent_', '');
                          const subcategoryIds = categories.filter(c => c.parent_id === parentId).map(c => c.id);
                          return subcategoryIds.includes((product as any).category_id);
                        }
                        return (product as any).category_id === productCategoryFilter;
                      }).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <ProductThumbnail productId={product.id} fallbackUrl={product.image_url} />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {product.name}
                              {(product as any).is_recommended && (
                                <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30 text-xs">
                                  Empfohlen
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getCategoryName((product as any).category_id)}</TableCell>
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

            {/* Bulk Importer */}
            <div className="mt-6">
              <BulkProductImporter
                categories={categories}
                onImportComplete={async () => {
                  // Refresh products list
                  const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                  if (productsData) {
                    setProducts(productsData as Product[]);
                  }
                }}
              />
            </div>

            {/* JSON Import Preview Dialog */}
            <Dialog open={jsonImportPreviewOpen} onOpenChange={setJsonImportPreviewOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>JSON Import Vorschau</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground mb-4">
                  {jsonImportData.length} Produkte werden importiert
                </div>
                <ScrollArea className="flex-1 max-h-[400px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead className="text-right">Preis</TableHead>
                        <TableHead className="text-right">Menge</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jsonImportData.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{product.name || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {product.description || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.price ? `${product.price.toLocaleString('de-DE')} €` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.stock_quantity ?? 0}
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.is_active !== false ? 'default' : 'secondary'}>
                              {product.is_active !== false ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setJsonImportPreviewOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    disabled={jsonImporting}
                    onClick={async () => {
                      setJsonImporting(true);
                      try {
                        let successCount = 0;
                        for (const product of jsonImportData) {
                          // Find or create category based on names
                          let categoryId = product.category_id || null;
                          
                          // If we have category names instead of IDs, resolve them
                          if (!categoryId && product.category_name) {
                            // First, find or create parent category if specified
                            let parentId: string | null = null;
                            if (product.parent_category_name) {
                              const existingParent = categories.find(
                                c => c.name.toLowerCase() === product.parent_category_name.toLowerCase() && c.parent_id === null
                              );
                              if (existingParent) {
                                parentId = existingParent.id;
                              } else {
                                // Create parent category
                                const { data: newParent } = await supabase
                                  .from('categories')
                                  .insert({ name: product.parent_category_name, parent_id: null, sort_order: 99 })
                                  .select()
                                  .single();
                                if (newParent) {
                                  parentId = newParent.id;
                                  // Add to local categories
                                  categories.push({ ...newParent, parent_id: null });
                                }
                              }
                            }
                            
                            // Find or create the actual category
                            const existingCategory = categories.find(
                              c => c.name.toLowerCase() === product.category_name.toLowerCase() && 
                                   (parentId ? c.parent_id === parentId : true)
                            );
                            if (existingCategory) {
                              categoryId = existingCategory.id;
                            } else {
                              // Create category under parent
                              const { data: newCategory } = await supabase
                                .from('categories')
                                .insert({ name: product.category_name, parent_id: parentId, sort_order: 0 })
                                .select()
                                .single();
                              if (newCategory) {
                                categoryId = newCategory.id;
                                categories.push(newCategory);
                              }
                            }
                          }
                          
                          const { error } = await supabase.from('products').insert({
                            name: product.name,
                            description: product.description || null,
                            price: product.price || 0,
                            category_id: categoryId,
                            stock_quantity: product.stock_quantity || 0,
                            is_active: product.is_active ?? true,
                            is_recommended: product.is_recommended ?? false,
                            discount_percentage: product.discount_percentage || 0,
                            tax_rate: product.tax_rate || 19,
                          });
                          if (!error) successCount++;
                        }
                        toast({ title: 'Import erfolgreich', description: `${successCount} Produkte importiert.` });
                        // Refresh products and categories
                        const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                        if (productsData) setProducts(productsData as Product[]);
                        const { data: categoriesData } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
                        if (categoriesData) setCategories(categoriesData);
                        setJsonImportPreviewOpen(false);
                        setJsonImportData([]);
                      } catch (err) {
                        toast({ title: 'Fehler', description: 'Import fehlgeschlagen.', variant: 'destructive' });
                      } finally {
                        setJsonImporting(false);
                      }
                    }}
                  >
                    {jsonImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importiere...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {jsonImportData.length} Produkte importieren
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement 
              categories={categories}
              onCategoriesChange={async () => {
                const { data } = await supabase
                  .from('categories')
                  .select('*')
                  .order('sort_order', { ascending: true });
                if (data) setCategories(data);
              }}
            />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Angebotsanfragen</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter:</span>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="pending">Neu</SelectItem>
                        <SelectItem value="confirmed">Angebot erstellt</SelectItem>
                        <SelectItem value="processing">In Bearbeitung</SelectItem>
                        <SelectItem value="shipped">Versendet</SelectItem>
                        <SelectItem value="delivered">Abgeschlossen</SelectItem>
                        <SelectItem value="cancelled">Storniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : orders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {orderStatusFilter === 'all' ? 'Keine Anfragen vorhanden.' : `Keine Anfragen mit Status "${statusLabels[orderStatusFilter as Order['status']]}".`}
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
                      {orders
                        .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                        .map((order) => (
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

          <TabsContent value="discounts">
            <DiscountCodeManagement />
          </TabsContent>


          <TabsContent value="emails">
            <EmailLogViewer />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
