import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  AreaChart,
  Area,
} from 'recharts';
import { Order, OrderItem, Profile } from '@/types/shop';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Euro, 
  ShoppingCart, 
  Users, 
  Award, 
  PercentIcon,
  Calendar as CalendarIcon,
  Package,
  UserPlus,
  RefreshCw,
  ArrowRight,
  Clock,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, startOfMonth, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface ActivityItem {
  id: string;
  type: 'order' | 'registration' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  icon: 'order' | 'user' | 'check' | 'cancel';
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders }) => {
  const [revenueFilter, setRevenueFilter] = useState<string>('all');
  const [customerCount, setCustomerCount] = useState(0);
  const [pendingCustomerCount, setPendingCustomerCount] = useState(0);
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [datePreset, setDatePreset] = useState<string>('30days');

  // Apply date preset
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
        break;
      case '7days':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case '30days':
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case 'thisWeek':
        setDateRange({ from: startOfWeek(today, { locale: de }), to: today });
        break;
      case 'thisMonth':
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case 'all':
        setDateRange({ from: new Date(2020, 0, 1), to: today });
        break;
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) });
    });
  }, [orders, dateRange]);

  useEffect(() => {
    const fetchCustomerStats = async () => {
      // Approved customers
      const { count: approved } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');
      setCustomerCount(approved || 0);

      // Pending customers
      const { count: pending } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      setPendingCustomerCount(pending || 0);

      // New customers this month
      const startOfMonthDate = startOfMonth(new Date());
      const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonthDate.toISOString());
      setNewCustomersThisMonth(newThisMonth || 0);
    };

    const fetchRecentActivities = async () => {
      const activities: ActivityItem[] = [];

      // Recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, customer_name, company_name')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrders) {
        recentOrders.forEach(order => {
          activities.push({
            id: order.id,
            type: 'order',
            title: `Neue Anfrage ${order.order_number}`,
            description: order.company_name || order.customer_name || 'Kunde',
            timestamp: order.created_at,
            icon: 'order',
          });
        });
      }

      // Recent registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, created_at, approval_status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentUsers) {
        recentUsers.forEach(user => {
          activities.push({
            id: user.id,
            type: 'registration',
            title: user.approval_status === 'pending' ? 'Neue Registrierung' : 'Kunde freigeschaltet',
            description: user.company_name || user.full_name || 'Neuer Kunde',
            timestamp: user.created_at,
            icon: user.approval_status === 'pending' ? 'user' : 'check',
          });
        });
      }

      // Sort by timestamp and take top 8
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 8));
    };

    fetchCustomerStats();
    fetchRecentActivities();

    // Set up realtime subscription for new orders
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          fetchRecentActivities();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          fetchCustomerStats();
          fetchRecentActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    filteredOrders.forEach((order) => {
      stats[order.status]++;
    });

    return stats;
  }, [filteredOrders]);

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

    filteredOrders.forEach((order) => {
      revenue[order.status] += order.total_amount;
    });

    return revenue;
  }, [filteredOrders]);

  // Calculate bestsellers
  const bestsellers = useMemo(() => {
    const productMap = new Map<string, BestsellerItem>();

    filteredOrders.forEach((order) => {
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
  }, [filteredOrders]);

  // Calculate customer activity
  const customerActivity = useMemo(() => {
    const customerMap = new Map<string, CustomerActivity>();

    filteredOrders.forEach((order) => {
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
  }, [filteredOrders]);

  // Calculate repeat customer rate
  const repeatCustomerRate = useMemo(() => {
    const customerOrderCounts = new Map<string, number>();
    
    filteredOrders.forEach((order) => {
      if (order.status === 'cancelled') return;
      const count = customerOrderCounts.get(order.user_id) || 0;
      customerOrderCounts.set(order.user_id, count + 1);
    });

    const totalCustomers = customerOrderCounts.size;
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
    
    return totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : '0';
  }, [filteredOrders]);

  // Calculate conversion rates
  const conversionStats = useMemo(() => {
    const total = filteredOrders.length;
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
  }, [filteredOrders, orderStats, revenueByStatus]);

  // Calculate period comparison (vs previous period)
  const periodComparison = useMemo(() => {
    const daysDiff = differenceInDays(dateRange.to, dateRange.from);
    const previousFrom = subDays(dateRange.from, daysDiff + 1);
    const previousTo = subDays(dateRange.from, 1);

    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: startOfDay(previousFrom), end: endOfDay(previousTo) });
    });

    const currentRevenue = Object.values(revenueByStatus).reduce((sum, val) => sum + val, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    const currentOrderCount = filteredOrders.length;
    const previousOrderCount = previousOrders.length;

    return {
      revenueChange: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : '0',
      orderChange: previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount * 100).toFixed(1) : '0',
      revenueUp: currentRevenue >= previousRevenue,
      ordersUp: currentOrderCount >= previousOrderCount,
    };
  }, [orders, filteredOrders, dateRange, revenueByStatus]);

  // Daily sparkline data (last 7 days)
  const sparklineData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: startOfDay(day), end: endOfDay(day) });
      });
      last7Days.push({
        day: format(day, 'EEE', { locale: de }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
      });
    }
    return last7Days;
  }, [orders]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const months = new Map<string, MonthlyData>();
    
    filteredOrders.forEach((order) => {
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
  }, [filteredOrders]);

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

  const totalOrders = filteredOrders.length;

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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    return `vor ${diffDays} Tagen`;
  };

  const getActivityIcon = (icon: ActivityItem['icon']) => {
    switch (icon) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'user':
        return <UserPlus className="h-4 w-4 text-yellow-500" />;
      case 'check':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'cancel':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Zeitraum:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Heute' },
                { value: '7days', label: '7 Tage' },
                { value: '30days', label: '30 Tage' },
                { value: 'thisWeek', label: 'Diese Woche' },
                { value: 'thisMonth', label: 'Dieser Monat' },
                { value: 'all', label: 'Alles' },
              ].map((preset) => (
                <Button
                  key={preset.value}
                  variant={datePreset === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyDatePreset(preset.value)}
                  className={datePreset === preset.value ? 'bg-gold text-navy-dark hover:bg-gold/90' : ''}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, 'dd.MM.yy', { locale: de })} - {format(dateRange.to, 'dd.MM.yy', { locale: de })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                      setDatePreset('custom');
                    }
                  }}
                  locale={de}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <a href="#anfragen">
            <ShoppingCart className="h-5 w-5 text-yellow-600" />
            <span className="text-sm">Neue Anfragen</span>
            <Badge className="bg-yellow-500 text-white">{orderStats.pending}</Badge>
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <a href="#kunden">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span className="text-sm">Freischaltungen</span>
            <Badge className="bg-blue-500 text-white">{pendingCustomerCount}</Badge>
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <a href="#produkte">
            <Package className="h-5 w-5 text-purple-600" />
            <span className="text-sm">Produkte</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <a href="#fahrzeuge">
            <Zap className="h-5 w-5 text-green-600" />
            <span className="text-sm">Fahrzeuge</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Umsatz</p>
                <p className="text-2xl font-bold">{formatCurrency(Object.values(revenueByStatus).reduce((sum, val) => sum + val, 0))}</p>
                <div className="flex items-center gap-1 text-xs">
                  {periodComparison.revenueUp ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={periodComparison.revenueUp ? 'text-green-500' : 'text-red-500'}>
                    {periodComparison.revenueChange}%
                  </span>
                  <span className="text-muted-foreground">vs. Vorperiode</span>
                </div>
              </div>
              <div className="h-12 w-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e20" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Anfragen</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <div className="flex items-center gap-1 text-xs">
                  {periodComparison.ordersUp ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={periodComparison.ordersUp ? 'text-green-500' : 'text-red-500'}>
                    {periodComparison.orderChange}%
                  </span>
                  <span className="text-muted-foreground">vs. Vorperiode</span>
                </div>
              </div>
              <div className="h-12 w-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ø Auftragswert</p>
                <p className="text-2xl font-bold">{formatCurrency(conversionStats.avgOrderValue)}</p>
                <p className="text-xs text-muted-foreground">pro Anfrage</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Wiederkaufrate</p>
                <p className="text-2xl font-bold text-purple-600">{repeatCustomerRate}%</p>
                <p className="text-xs text-muted-foreground">Stammkunden</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Neue Anfragen</p>
              <p className="text-xl font-bold text-yellow-600">{orderStats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">In Bearbeitung</p>
              <p className="text-xl font-bold text-purple-600">{orderStats.processing}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Abgeschlossen</p>
              <p className="text-xl font-bold text-green-600">{orderStats.delivered}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Aktive Kunden</p>
              <p className="text-xl font-bold text-blue-600">{customerCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Neukunden/Monat</p>
              <p className="text-xl font-bold text-green-600">{newCustomersThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground">Stornoquote</p>
              <p className="text-xl font-bold text-red-600">{conversionStats.cancelRate}%</p>
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
              <Clock className="h-5 w-5 text-blue-600" />
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

      {/* Charts Row + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
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

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Letzte Aktivitäten</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Keine Aktivitäten</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution + Bestsellers + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statusverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
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
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bestsellers.slice(0, 5).map((item, index) => (
                  <div key={item.product_name} className="flex items-center gap-2">
                    <Badge variant={index < 3 ? 'default' : 'secondary'} className={cn("w-6 justify-center", index < 3 && 'bg-gold text-navy-dark')}>
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.total_quantity}x • {formatCurrency(item.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customerActivity.slice(0, 5).map((customer, index) => (
                  <div key={`${customer.customer_name}-${index}`} className="flex items-center gap-2">
                    <Badge variant={index < 3 ? 'default' : 'secondary'} className={cn("w-6 justify-center", index < 3 && 'bg-gold text-navy-dark')}>
                      {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{customer.company_name || customer.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{customer.order_count}x • {formatCurrency(customer.total_spent)}</p>
                    </div>
                  </div>
                ))}
              </div>
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
