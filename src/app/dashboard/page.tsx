'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

const MetricCard = ({ title, value, change, changeLabel, icon, trend }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change !== undefined && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
          {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
          <span className={
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 
            'text-muted-foreground'
          }>
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span>{changeLabel}</span>}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { invoices, clients, expenses, settings } = useStore();
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    totalExpenses: 0,
    currentBalance: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    overdue: 0,
    monthlyGrowth: 0,
    expenseGrowth: 0,
    clientGrowth: 0,
  });

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [invoiceStatusData, setInvoiceStatusData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);

  useEffect(() => {
    calculateMetrics();
    prepareChartData();
  }, [invoices, clients, expenses]);

  const calculateMetrics = () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentBalance = totalEarnings - totalExpenses;
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
    
    // Calculate overdue invoices
    const today = new Date();
    const overdue = invoices.filter(inv => {
      if (inv.status === 'Paid') return false;
      const dueDate = new Date(inv.due_date);
      return dueDate < today;
    }).length;

    // Calculate monthly growth
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthEarnings = paidInvoices
      .filter(inv => {
        const invDate = new Date(inv.date_issued);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthEarnings = paidInvoices
      .filter(inv => {
        const invDate = new Date(inv.date_issued);
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const monthlyGrowth = lastMonthEarnings > 0 
      ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0;

    // Calculate expense growth
    const currentMonthExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    const lastMonthExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);

    const expenseGrowth = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;

    // Calculate client growth (new clients this month vs last month)
    const currentMonthClients = clients.filter(client => {
      const clientDate = new Date(client.created_at);
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    }).length;

    const lastMonthClients = clients.filter(client => {
      const clientDate = new Date(client.created_at);
      return clientDate.getMonth() === lastMonth && clientDate.getFullYear() === lastMonthYear;
    }).length;

    const clientGrowth = lastMonthClients > 0 
      ? ((currentMonthClients - lastMonthClients) / lastMonthClients) * 100 
      : 0;

    setMetrics({
      totalEarnings,
      totalExpenses,
      currentBalance,
      totalClients: clients.length,
      totalInvoices: invoices.length,
      pendingInvoices,
      overdue,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      expenseGrowth: Math.round(expenseGrowth * 100) / 100,
      clientGrowth: Math.round(clientGrowth * 100) / 100,
    });
  };

  const prepareChartData = () => {
    // Revenue chart data (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueChart = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.date_issued);
          return invDate.getMonth() === month && 
                 invDate.getFullYear() === year && 
                 inv.status === 'Paid';
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const monthExpenses = expenses
        .filter(exp => {
          const expDate = new Date(exp.date);
          return expDate.getMonth() === month && expDate.getFullYear() === year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      revenueChart.push({
        month: monthNames[month],
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      });
    }
    setRevenueData(revenueChart);

    // Invoice status data
    const statusCounts = invoices.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / invoices.length) * 100),
    }));
    setInvoiceStatusData(statusData);

    // Expense category data
    const categoryCounts = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryCounts).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / metrics.totalExpenses) * 100),
    }));
    setExpenseCategoryData(categoryData);
  };

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime())
    .slice(0, 5);

  const recentClients = clients
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const upcomingPayments = invoices
    .filter(inv => inv.status === 'Pending')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalEarnings)}
          change={metrics.monthlyGrowth}
          changeLabel="from last month"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={metrics.monthlyGrowth > 0 ? 'up' : metrics.monthlyGrowth < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Current Balance"
          value={formatCurrency(metrics.currentBalance)}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Clients"
          value={metrics.totalClients.toString()}
          change={metrics.clientGrowth}
          changeLabel="new this month"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={metrics.clientGrowth > 0 ? 'up' : metrics.clientGrowth < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Pending Invoices"
          value={metrics.pendingInvoices.toString()}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Expenses (Last 6 Months)</CardTitle>
            <CardDescription>
              Track your business performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#ff7c7c"
                  fill="#ff7c7c"
                  fillOpacity={0.6}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <CardDescription>
              Overview of your invoice statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={invoiceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Breakdown of your expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={expenseCategoryData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/invoices">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {invoice.client_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {invoice.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.client_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <Badge
                      variant={
                        invoice.status === 'Paid' ? 'default' :
                        invoice.status === 'Pending' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Clients</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/clients">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.map((client) => (
                <div key={client.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {client.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {client.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/invoices?status=pending">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending payments
                </p>
              ) : (
                upcomingPayments.map((invoice) => {
                  const dueDate = new Date(invoice.due_date);
                  const today = new Date();
                  const isOverdue = dueDate < today;
                  const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isOverdue ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {invoice.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isOverdue ? `Overdue by ${Math.abs(daysDiff)} days` : 
                             daysDiff === 0 ? 'Due today' : `Due in ${daysDiff} days`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(invoice.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/dashboard/invoices/create">
                <FileText className="h-6 w-6" />
                Create Invoice
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/dashboard/clients/create">
                <Users className="h-6 w-6" />
                Add Client
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/dashboard/expenses/create">
                <DollarSign className="h-6 w-6" />
                Add Expense
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
              <Link href="/dashboard/analytics">
                <TrendingUp className="h-6 w-6" />
                View Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
