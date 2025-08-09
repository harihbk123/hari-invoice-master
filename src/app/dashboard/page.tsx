'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricsCards } from '@/features/dashboard/components/metrics-cards';
import { RevenueChart } from '@/features/dashboard/components/revenue-chart';
import { ClientDistributionChart } from '@/features/dashboard/components/client-distribution-chart';
import { RecentInvoices } from '@/features/dashboard/components/recent-invoices';
import { ExpenseOverview } from '@/features/dashboard/components/expense-overview';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { invoices, clients, expenses, settings } = useStore();
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    totalExpenses: 0,
    currentBalance: 0,
    totalClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    averageInvoice: 0,
    monthlyGrowth: 0,
  });

  useEffect(() => {
    // Calculate metrics
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalEarnings = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentBalance = totalEarnings - totalExpenses;
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
    const averageInvoice = paidInvoices.length > 0 ? totalEarnings / paidInvoices.length : 0;

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

    setMetrics({
      totalEarnings,
      totalExpenses,
      currentBalance,
      totalClients: clients.length,
      totalInvoices: invoices.length,
      pendingInvoices,
      averageInvoice,
      monthlyGrowth,
    });
  }, [invoices, clients, expenses]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
          <Link href="/expenses/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              From {metrics.totalInvoices} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <div className={cn(
              "h-4 w-4",
              metrics.currentBalance >= 0 ? "text-success" : "text-destructive"
            )}>
              {metrics.currentBalance >= 0 ? <TrendingUp /> : <TrendingDown />}
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              metrics.currentBalance >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(metrics.currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.currentBalance >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingInvoices} pending invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly earnings and expenses trend</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart invoices={invoices} expenses={expenses} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Client Distribution</CardTitle>
            <CardDescription>Revenue by client</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientDistributionChart invoices={invoices} clients={clients} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your latest issued invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentInvoices invoices={invoices.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Overview</CardTitle>
            <CardDescription>Top expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseOverview expenses={expenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}