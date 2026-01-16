import React, { useMemo, useState } from 'react';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Order, OrderItem } from '@/types/shop';
import { FileText, TrendingUp, Euro, ShoppingCart } from 'lucide-react';

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

interface AdminDashboardProps {
  orders: OrderWithItems[];
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

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

      {/* Revenue Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Umsatz-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Object.keys(revenueByStatus) as Order['status'][]).map((status) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColors[status] }}
                  />
                  <span className="font-medium">{statusLabels[status]}</span>
                  <Badge variant="outline">{orderStats[status]} Anfragen</Badge>
                </div>
                <span className="font-bold">{formatCurrency(revenueByStatus[status])}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
