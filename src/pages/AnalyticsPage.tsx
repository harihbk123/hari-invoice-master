import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice } from '../models/invoice';
import { Expense } from '../models/expense';
import { Client } from '../models/client';
import MonthlyRevenueChart from '../components/charts/MonthlyRevenueChart';
import ClientDistributionChart from '../components/charts/ClientDistributionChart';
import InvoiceStatusChart from '../components/charts/InvoiceStatusChart';
import ExpenseCategoryChart from '../components/charts/ExpenseCategoryChart';
import { formatCurrency } from '../utils/format';
import { ChartBarIcon, TrendingUpIcon, CalendarIcon, FilterIcon, DownloadIcon } from '@heroicons/react/24/outline';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: { month: string; amount: number }[];
    quarterly: { quarter: string; amount: number }[];
    yearly: { year: string; amount: number }[];
  };
  expenses: {
    total: number;
    monthly: { month: string; amount: number }[];
    byCategory: { category: string; amount: number; percentage: number }[];
  };
  profit: {
    net: number;
    margin: number;
    trend: 'up' | 'down' | 'stable';
  };
  clients: {
    topClients: { id: string; name: string; revenue: number; invoiceCount: number }[];
    distribution: { name: string; value: number }[];
  };
  invoices: {
    statusBreakdown: { status: string; count: number; amount: number }[];
    averageValue: number;
    paymentTime: number; // average days to payment
  };
}

type Period = 'monthly' | 'quarterly' | 'yearly' | 'custom';
type ViewMode = 'overview' | 'revenue' | 'expenses' | 'clients' | 'performance';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('monthly');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  useEffect(() => {
    loadAnalyticsData();
  }, [period, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load all necessary data
      const [invoicesResult, expensesResult, clientsResult] = await Promise.all([
        supabase.from('invoices').select('*').gte('date_issued', dateRange.from).lte('date_issued', dateRange.to),
        supabase.from('expenses').select('*').gte('date_incurred', dateRange.from).lte('date_incurred', dateRange.to),
        supabase.from('clients').select('*')
      ]);

      const invoices = invoicesResult.data as Invoice[] || [];
      const expenses = expensesResult.data as Expense[] || [];
      const clients = clientsResult.data as Client[] || [];

      // Process analytics data
      const analytics = processAnalyticsData(invoices, expenses, clients, period);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (
    invoices: Invoice[],
    expenses: Expense[],
    clients: Client[],
    period: Period
  ): AnalyticsData => {
    // Calculate revenue metrics
    const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Calculate monthly revenue
    const monthlyRevenue = calculatePeriodData(paidInvoices, 'monthly');
    const quarterlyRevenue = calculatePeriodData(paidInvoices, 'quarterly');
    const yearlyRevenue = calculatePeriodData(paidInvoices, 'yearly');

    // Calculate expense metrics
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyExpenses = calculateExpensePeriodData(expenses, 'monthly');
    
    // Calculate expense by category
    const categoryMap = new Map<string, number>();
    expenses.forEach(exp => {
      const category = exp.categoryName || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + exp.amount);
    });
    
    const expensesByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Calculate profit metrics
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Determine trend (simplified - compare last two periods)
    const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.amount || 0;
    const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.amount || 0;
    const trend = lastMonthRevenue > prevMonthRevenue ? 'up' : lastMonthRevenue < prevMonthRevenue ? 'down' : 'stable';

    // Calculate client metrics
    const clientRevenueMap = new Map<string, { revenue: number; invoiceCount: number; name: string }>();
    paidInvoices.forEach(inv => {
      const clientId = inv.clientId;
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const existing = clientRevenueMap.get(clientId) || { revenue: 0, invoiceCount: 0, name: client.name };
        existing.revenue += inv.amount;
        existing.invoiceCount += 1;
        clientRevenueMap.set(clientId, existing);
      }
    });

    const topClients = Array.from(clientRevenueMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const clientDistribution = topClients.slice(0, 5).map(client => ({
      name: client.name,
      value: client.revenue
    }));

    // Calculate invoice metrics
    const statusBreakdown = ['Paid', 'Pending', 'Overdue', 'Draft'].map(status => {
      const statusInvoices = invoices.filter(inv => inv.status === status);
      return {
        status,
        count: statusInvoices.length,
        amount: statusInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      };
    });

    const averageInvoiceValue = invoices.length > 0
      ? invoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length
      : 0;

    // Calculate average payment time (simplified)
    const paymentTimes = paidInvoices.map(inv => {
      const issued = new Date(inv.dateIssued);
      const due = new Date(inv.dueDate);
      return Math.ceil((due.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgPaymentTime = paymentTimes.length > 0
      ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length
      : 0;

    return {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        quarterly: quarterlyRevenue,
        yearly: yearlyRevenue
      },
      expenses: {
        total: totalExpenses,
        monthly: monthlyExpenses,
        byCategory: expensesByCategory
      },
      profit: {
        net: netProfit,
        margin: profitMargin,
        trend
      },
      clients: {
        topClients,
        distribution: clientDistribution
      },
      invoices: {
        statusBreakdown,
        averageValue: averageInvoiceValue,
        paymentTime: avgPaymentTime
      }
    };
  };

  const calculatePeriodData = (invoices: Invoice[], periodType: Period) => {
    const periodMap = new Map<string, number>();
    
    invoices.forEach(inv => {
      const date = new Date(inv.dateIssued);
      let periodKey = '';
      
      if (periodType === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (periodType === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periodKey = `${date.getFullYear()}-Q${quarter}`;
      } else if (periodType === 'yearly') {
        periodKey = date.getFullYear().toString();
      }
      
      periodMap.set(periodKey, (periodMap.get(periodKey) || 0) + inv.amount);
    });
    
    return Array.from(periodMap.entries())
      .map(([period, amount]) => ({ month: period, quarter: period, year: period, amount }))
      .sort((a, b) => (a.month || a.quarter || a.year).localeCompare(b.month || b.quarter || b.year));
  };

  const calculateExpensePeriodData = (expenses: Expense[], periodType: string) => {
    const periodMap = new Map<string, number>();
    
    expenses.forEach(exp => {
      const date = new Date(exp.dateIncurred);
      const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      periodMap.set(periodKey, (periodMap.get(periodKey) || 0) + exp.amount);
    });
    
    return Array.from(periodMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const handleExport = () => {
    // Export analytics data as CSV or PDF
    console.log('Exporting analytics data...');
    // Implementation would go here
  };

  const applyCustomRange = () => {
    if (customRange.from && customRange.to) {
      setDateRange(customRange);
      setPeriod('custom');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Comprehensive insights into your business performance</p>
          </div>
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'revenue', 'expenses', 'clients', 'performance'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Period Selector and Date Range */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex gap-2">
            {(['monthly', 'quarterly', 'yearly'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm font-medium capitalize ${
                  period === p
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={period === 'custom' ? customRange.from : dateRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className="px-3 py-1 border rounded-md text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={period === 'custom' ? customRange.to : dateRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className="px-3 py-1 border rounded-md text-sm"
            />
            <button
              onClick={applyCustomRange}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {(viewMode === 'overview' || viewMode === 'performance') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              {analyticsData.profit.trend === 'up' && (
                <span className="text-green-500 text-sm">↑ Trending up</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(analyticsData.revenue.total)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(analyticsData.expenses.total)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className={`text-sm ${analyticsData.profit.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {analyticsData.profit.margin.toFixed(1)}% margin
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
            <p className={`text-2xl font-bold mt-1 ${
              analyticsData.profit.net >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(analyticsData.profit.net)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FilterIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Avg Invoice Value</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(analyticsData.invoices.averageValue)}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <MonthlyRevenueChart 
              data={period === 'yearly' ? analyticsData.revenue.yearly : 
                    period === 'quarterly' ? analyticsData.revenue.quarterly :
                    analyticsData.revenue.monthly} 
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Client Distribution</h3>
            <ClientDistributionChart data={analyticsData.clients.distribution} />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Status</h3>
            <InvoiceStatusChart data={analyticsData.invoices.statusBreakdown} />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
            <ExpenseCategoryChart data={analyticsData.expenses.byCategory} />
          </div>
        </div>
      )}

      {/* Revenue View */}
      {viewMode === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Analysis</h3>
            <MonthlyRevenueChart 
              data={period === 'yearly' ? analyticsData.revenue.yearly : 
                    period === 'quarterly' ? analyticsData.revenue.quarterly :
                    analyticsData.revenue.monthly} 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performing Clients</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData.clients.topClients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(client.revenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{client.invoiceCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatCurrency(client.revenue / client.invoiceCount)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expenses View */}
      {viewMode === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Trend</h3>
              <MonthlyRevenueChart data={analyticsData.expenses.monthly} />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
              <ExpenseCategoryChart data={analyticsData.expenses.byCategory} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Top Expense Categories</h3>
            <div className="space-y-4">
              {analyticsData.expenses.byCategory.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-900 font-semibold">{formatCurrency(category.amount)}</span>
                    <span className="text-gray-500 text-sm">{category.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clients View */}
      {viewMode === 'clients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Client Revenue Distribution</h3>
            <ClientDistributionChart data={analyticsData.clients.distribution} />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Client Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-xl font-bold">{analyticsData.clients.topClients.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg Client Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    analyticsData.revenue.total / Math.max(1, analyticsData.clients.topClients.length)
                  )}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Top Client Share</p>
                <p className="text-xl font-bold">
                  {analyticsData.clients.topClients[0] 
                    ? `${((analyticsData.clients.topClients[0].revenue / analyticsData.revenue.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance View */}
      {viewMode === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Time</p>
                <p className="text-2xl font-bold">{analyticsData.invoices.paymentTime.toFixed(0)} days</p>
                <p className="text-xs text-gray-400">Average time to payment</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                <p className={`text-2xl font-bold ${analyticsData.profit.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analyticsData.profit.margin.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Net profit margin</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Invoice Success Rate</p>
                <p className="text-2xl font-bold">
                  {((analyticsData.invoices.statusBreakdown.find(s => s.status === 'Paid')?.count || 0) / 
                    Math.max(1, analyticsData.invoices.statusBreakdown.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">Paid invoices</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Invoice Status Overview</h3>
            <InvoiceStatusChart data={analyticsData.invoices.statusBreakdown} />
          </div>
        </div>
      )}
    </div>
  );
}