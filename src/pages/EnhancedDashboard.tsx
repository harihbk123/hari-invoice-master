import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Invoice } from '../models/invoice';
import { Client } from '../models/client';
import { Expense } from '../models/expense';
import MonthlyRevenueChart from '../components/charts/MonthlyRevenueChart';
import ClientDistributionChart from '../components/charts/ClientDistributionChart';
import InvoiceStatusChart from '../components/charts/InvoiceStatusChart';
import ExpenseCategoryChart from '../components/charts/ExpenseCategoryChart';
import BalanceCards from '../components/expenses/BalanceCards';
import { formatCurrency, formatDate } from '../utils/format';
import { 
  CurrencyRupeeIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  TrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalClients: number;
  activeClients: number;
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  monthlyGrowth: number;
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'invoice' | 'payment' | 'expense' | 'client';
  description: string;
  amount?: number;
  timestamp: string;
  status?: string;
}

export default function EnhancedDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalClients: 0,
    activeClients: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    averageInvoiceValue: 0,
    monthlyGrowth: 0,
    recentActivity: []
  });

  const [chartData, setChartData] = useState({
    monthlyRevenue: [],
    clientDistribution: [],
    invoiceStatus: [],
    expenseCategories: []
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === '7days') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30days') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (dateRange === '90days') {
        startDate.setDate(startDate.getDate() - 90);
      } else if (dateRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Load all data in parallel
      const [invoicesResult, clientsResult, expensesResult] = await Promise.all([
        supabase.from('invoices').select('*').order('date_issued', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('expenses').select('*').order('date_incurred', { ascending: false })
      ]);

      const invoices = (invoicesResult.data as Invoice[]) || [];
      const clients = (clientsResult.data as Client[]) || [];
      const expenses = (expensesResult.data as Expense[]) || [];

      // Calculate metrics
      const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
      const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
      const overdueInvoices = invoices.filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return inv.status !== 'Paid' && dueDate < new Date();
      });

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Calculate active clients (those with invoices in the last 90 days)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const activeClientIds = new Set(
        invoices
          .filter(inv => new Date(inv.dateIssued) > threeMonthsAgo)
          .map(inv => inv.clientId)
      );

      // Calculate monthly growth
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentMonthRevenue = paidInvoices
        .filter(inv => new Date(inv.dateIssued).getMonth() === currentMonth)
        .reduce((sum, inv) => sum + inv.amount, 0);
      const lastMonthRevenue = paidInvoices
        .filter(inv => new Date(inv.dateIssued).getMonth() === lastMonth)
        .reduce((sum, inv) => sum + inv.amount, 0);
      const monthlyGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // Generate recent activity
      const recentActivity = generateRecentActivity(invoices, expenses, clients);

      // Prepare chart data
      const monthlyRevenueData = calculateMonthlyRevenue(paidInvoices);
      const clientDistributionData = calculateClientDistribution(invoices, clients);
      const invoiceStatusData = calculateInvoiceStatus(invoices);
      const expenseCategoryData = calculateExpenseCategories(expenses);

      setMetrics({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalClients: clients.length,
        activeClients: activeClientIds.size,
        totalInvoices: invoices.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
        monthlyGrowth,
        recentActivity
      });

      setChartData({
        monthlyRevenue: monthlyRevenueData,
        clientDistribution: clientDistributionData,
        invoiceStatus: invoiceStatusData,
        expenseCategories: expenseCategoryData
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyRevenue = (invoices: Invoice[]) => {
    const monthlyMap = new Map<string, number>();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last6Months.push(monthKey);
      monthlyMap.set(monthKey, 0);
    }

    invoices.forEach(inv => {
      const date = new Date(inv.dateIssued);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + inv.amount);
      }
    });

    return last6Months.map(month => ({
      month,
      amount: monthlyMap.get(month) || 0
    }));
  };

  const calculateClientDistribution = (invoices: Invoice[], clients: Client[]) => {
    const clientRevenueMap = new Map<string, number>();
    
    invoices
      .filter(inv => inv.status === 'Paid')
      .forEach(inv => {
        clientRevenueMap.set(
          inv.clientId,
          (clientRevenueMap.get(inv.clientId) || 0) + inv.amount
        );
      });

    return Array.from(clientRevenueMap.entries())
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          name: client?.name || 'Unknown',
          value: revenue
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const calculateInvoiceStatus = (invoices: Invoice[]) => {
    const statusCount = new Map<string, number>();
    
    invoices.forEach(inv => {
      const status = inv.status || 'Draft';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    return ['Paid', 'Pending', 'Overdue', 'Draft'].map(status => ({
      status,
      count: statusCount.get(status) || 0,
      amount: invoices
        .filter(inv => inv.status === status)
        .reduce((sum, inv) => sum + inv.amount, 0)
    }));
  };

  const calculateExpenseCategories = (expenses: Expense[]) => {
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(exp => {
      const category = exp.categoryName || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + exp.amount);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const generateRecentActivity = (invoices: Invoice[], expenses: Expense[], clients: Client[]): Activity[] => {
    const activities: Activity[] = [];

    // Add recent invoices
    invoices.slice(0, 3).forEach(inv => {
      activities.push({
        id: inv.id,
        type: 'invoice',
        description: `Invoice #${inv.id} created`,
        amount: inv.amount,
        timestamp: inv.dateIssued,
        status: inv.status
      });
    });

    // Add recent expenses
    expenses.slice(0, 2).forEach(exp => {
      activities.push({
        id: exp.id,
        type: 'expense',
        description: exp.description,
        amount: exp.amount,
        timestamp: exp.dateIncurred
      });
    });

    // Sort by timestamp
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <Link to="/invoices/new" className="btn btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
            </div>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              metrics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.monthlyGrowth >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              {Math.abs(metrics.monthlyGrowth).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">{metrics.activeClients} active</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalClients}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-orange-600">{metrics.pendingInvoices} pending</span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalInvoices}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <span className={`text-sm font-medium ${
              metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metrics.profitMargin.toFixed(1)}% margin
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p className={`text-2xl font-bold mt-1 ${
            metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(metrics.netProfit)}
          </p>
        </div>
      </div>

      {/* Balance Overview */}
      <BalanceCards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Revenue Trend</h3>
            <Link to="/analytics" className="text-sm text-primary hover:underline">
              View Details →
            </Link>
          </div>
          <MonthlyRevenueChart data={chartData.monthlyRevenue} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Top Clients</h3>
            <Link to="/clients" className="text-sm text-primary hover:underline">
              View All →
            </Link>
          </div>
          <ClientDistributionChart data={chartData.clientDistribution} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Invoice Status</h3>
            <Link to="/invoices" className="text-sm text-primary hover:underline">
              Manage →
            </Link>
          </div>
          <InvoiceStatusChart data={chartData.invoiceStatus} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            <Link to="/expenses" className="text-sm text-primary hover:underline">
              View All →
            </Link>
          </div>
          <ExpenseCategoryChart data={chartData.expenseCategories} />
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'invoice' ? 'bg-blue-100' :
                  activity.type === 'expense' ? 'bg-red-100' :
                  activity.type === 'payment' ? 'bg-green-100' :
                  'bg-gray-100'
                }`}>
                  {activity.type === 'invoice' && <DocumentTextIcon className="h-5 w-5 text-blue-600" />}
                  {activity.type === 'expense' && <CurrencyRupeeIcon className="h-5 w-5 text-red-600" />}
                  {activity.type === 'payment' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  {activity.type === 'client' && <UserGroupIcon className="h-5 w-5 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {activity.amount && (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                    {activity.status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/invoices/new" className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Create Invoice</span>
              </div>
            </Link>
            <Link to="/expenses/new" className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <CurrencyRupeeIcon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Add Expense</span>
              </div>
            </Link>
            <Link to="/clients/new" className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Add Client</span>
              </div>
            </Link>
            <Link to="/analytics" className="block w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="h-5 w-5 text-gray-600" />
                <span className="font-medium">View Analytics</span>
              </div>
            </Link>
          </div>

          {/* Alerts */}
          {metrics.overdueInvoices > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {metrics.overdueInvoices} Overdue Invoice{metrics.overdueInvoices > 1 ? 's' : ''}
                  </p>
                  <Link to="/invoices?filter=overdue" className="text-xs text-red-600 hover:underline">
                    View overdue invoices →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}