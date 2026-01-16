import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts';
import { Order, OrderItem, Profile } from '@/types/shop';
import { 
  FileText, 
  TrendingUp, 
  Euro, 
  ShoppingCart, 
  Users, 
  Award, 
  PercentIcon,
  Calendar,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  profiles?: Profile;
}

interface AdminDashboardProps {
  orders: OrderWithItems[];
}

interface BestsellerItem {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

interface CustomerActivity {
  customer_name: string;
  company_name: string | null;
  order_count: number;
  total_spent: number;
  last_order_date: string;
}

interface MonthlyData {
  month: string;
  orders: number;
  revenue: number;
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
  pending: '#eab308',
  confirmed: '#3b82f6',
  processing: '#a855f7',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#06b6d4'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders }) => {
  const [revenueFilter, setRevenueFilter] = useState<string>('all');
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const fetchCustomerCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');
      setCustomerCount(count || 0);
    };
    fetchCustomerCount();
  }, []);

  // Count orders by status
  const orderStats = useMemo(() => {
    const stats: Record<Order['status'], number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      stats[order.status]++;
    });

    return stats;
  }, [orders]);

  // Calculate revenue by status
  const revenueByStatus = useMemo(() => {
    const revenue: Record<Order['status'], number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      revenue[order.status] += order.total_amount;
    });

    return revenue;
  }, [orders]);

  // Calculate bestsellers
  const bestsellers = useMemo(() => {
    const productMap = new Map<string, BestsellerItem>();

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      
      order.order_items.forEach((item) => {
        const key = item.product_name;
        const existing = productMap.get(key);
        
        if (existing) {
          existing.total_quantity += item.quantity;
          existing.total_revenue += item.total_price;
          existing.order_count += 1;
        } else {
          productMap.set(key, {
            product_name: item.product_name,
            total_quantity: item.quantity,
            total_revenue: item.total_price,
            order_count: 1,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);
  }, [orders]);

  // Calculate customer activity
  const customerActivity = useMemo(() => {
    const customerMap = new Map<string, CustomerActivity>();

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      
      const customerId = order.user_id;
      const existing = customerMap.get(customerId);
      
      if (existing) {
        existing.order_count += 1;
        existing.total_spent += order.total_amount;
        if (new Date(order.created_at) > new Date(existing.last_order_date)) {
          existing.last_order_date = order.created_at;
        }
      } else {
        customerMap.set(customerId, {
          customer_name: order.profiles?.full_name || order.company_name || 'Unbekannt',
          company_name: order.profiles?.company_name || order.company_name || null,
          order_count: 1,
          total_spent: order.total_amount,
          last_order_date: order.created_at,
        });
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);
  }, [orders]);

  // Calculate conversion rates
  const conversionStats = useMemo(() => {
    const total = orders.length;
    const delivered = orderStats.delivered;
    const cancelled = orderStats.cancelled;
    const inProgress = orderStats.pending + orderStats.confirmed + orderStats.processing + orderStats.shipped;

    return {
      conversionRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : '0',
      cancelRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0',
      pendingRate: total > 0 ? ((inProgress / total) * 100).toFixed(1) : '0',
      avgOrderValue: total > 0 
        ? Object.values(revenueByStatus).reduce((a, b) => a + b, 0) / total 
        : 0,
    };
  }, [orders, orderStats, revenueByStatus]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = new Map<string, MonthlyData>();
    
    orders.forEach((order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      
      const existing = months.get(monthKey);
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total_amount;
      } else {
        months.set(monthKey, {
          month: monthLabel,
          orders: 1,
          revenue: order.total_amount,
        });
      }
    });

    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => data);
  }, [orders]);

  // Pie chart data for status distribution
  const pieData = useMemo(() => {
    return Object.entries(orderStats)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusLabels[status as Order['status']],
        value: count,
        color: statusColors[status as Order['status']],
      }));
  }, [orderStats]);

  // Chart data
  const chartData = useMemo(() => {
    const statuses: Order['status'][] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (revenueFilter === 'all') {
      return statuses.map((status) => ({
        name: statusLabels[status],
        umsatz: revenueByStatus[status],
        color: statusColors[status],
        status,
      }));
    }

    return statuses
      .filter((status) => status === revenueFilter)
      .map((status) => ({
        name: statusLabels[status],
        umsatz: revenueByStatus[status],
        color: statusColors[status],
        status,
      }));
  }, [revenueByStatus, revenueFilter]);

  // Total revenue (based on filter)
  const totalRevenue = useMemo(() => {
    if (revenueFilter === 'all') {
      return Object.values(revenueByStatus).reduce((sum, val) => sum + val, 0);
    }
    return revenueByStatus[revenueFilter as Order['status']] || 0;
  }, [revenueByStatus, revenueFilter]);

  const totalOrders = orders.length;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt Anfragen</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Neue Anfragen</p>
                <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamt Umsatz</p>
                <p className="text-2xl font-bold">{formatCurrency(Object.values(revenueByStatus).reduce((sum, val) => sum + val, 0))}</p>
              </div>
              <Euro className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktive Kunden</p>
                <p className="text-2xl font-bold text-blue-600">{customerCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ø Auftragswert</p>
                <p className="text-2xl font-bold">{formatCurrency(conversionStats.avgOrderValue)}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Abschlussquote</p>
              <PercentIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-green-600">{conversionStats.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">abgeschlossen</p>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all" 
                style={{ width: `${conversionStats.conversionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">In Bearbeitung</p>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">{conversionStats.pendingRate}%</p>
              <p className="text-sm text-muted-foreground">offen</p>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all" 
                style={{ width: `${conversionStats.pendingRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Stornoquote</p>
              <PercentIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">{conversionStats.cancelRate}%</p>
              <p className="text-sm text-muted-foreground">storniert</p>
            </div>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all" 
                style={{ width: `${conversionStats.cancelRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monatlicher Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Umsatz' : 'Anfragen'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Anfragen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Umsatz</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statusverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Anfragen']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bestsellers & Customer Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestsellers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Top 10 Bestseller</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {bestsellers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Noch keine Daten vorhanden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Produkt</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestsellers.map((item, index) => (
                    <TableRow key={item.product_name}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'} className={index < 3 ? 'bg-gold text-navy-dark' : ''}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="text-right">{item.total_quantity}x</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total_revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Customer Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Top 10 Kunden</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {customerActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Noch keine Daten vorhanden.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Anfragen</TableHead>
                    <TableHead className="text-right">Umsatz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerActivity.map((customer, index) => (
                    <TableRow key={`${customer.customer_name}-${index}`}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'} className={index < 3 ? 'bg-gold text-navy-dark' : ''}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium max-w-[180px] truncate">{customer.company_name || customer.customer_name}</p>
                          <p className="text-xs text-muted-foreground">Letzte: {formatDate(customer.last_order_date)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{customer.order_count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(customer.total_spent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Umsatz nach Status</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Select value={revenueFilter} onValueChange={setRevenueFilter}>
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
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalRevenue)}</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Umsatz']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="umsatz" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anfragen nach Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(orderStats) as Order['status'][]).map((status) => (
              <div
                key={status}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColors[status] }}
                />
                <span className="text-sm font-medium">{statusLabels[status]}</span>
                <Badge variant="secondary" className="ml-1">
                  {orderStats[status]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
