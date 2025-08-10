'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp, 
  Plus,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    invoices,
    clients,
    expenses,
    settings,
    getTotalEarnings,
    getTotalExpenses,
    getCurrentBalance,
    getRecentInvoices,
    getRecentExpenses,
    getOverdueInvoices,
  } = useStore();

  const totalEarnings = getTotalEarnings();
  const totalExpenses = getTotalExpenses();
  const currentBalance = getCurrentBalance();
  const recentInvoices = getRecentInvoices(5);
  const recentExpenses = getRecentExpenses(5);
  const overdueInvoices = getOverdueInvoices();

  const currency = settings?.currency || 'INR';

  // Calculate some stats
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
  const draftInvoices = invoices.filter(inv => inv.status === 'Draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/expenses/create">
              <Receipt className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert for overdue invoices */}
      {overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700">
                  Total amount: {formatCurrency(
                    overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
                    currency
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarnings, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} paid invoice{paidInvoices !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentBalance, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Earnings minus expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Active client{clients.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending</span>
              <span className="font-medium">{pendingInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Paid</span>
              <span className="font-medium text-green-600">{paidInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Drafts</span>
              <span className="font-medium text-gray-600">{draftInvoices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Overdue</span>
              <span className="font-medium text-red-600">{overdueInvoices.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <CardDescription>Your latest invoice activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{invoice.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invoice.date_issued)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(invoice.amount, currency)}
                      </p>
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No invoices yet</p>
              )}
            </div>
            {recentInvoices.length > 0 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/invoices">View All Invoices</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
            <CardDescription>Your latest expense entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(expense.date_incurred)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-red-600">
                        -{formatCurrency(expense.amount, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.category_name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No expenses yet</p>
              )}
            </div>
            {recentExpenses.length > 0 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/expenses">View All Expenses</Link>
              </Button>
            )}
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
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/invoices/create" className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>Create Invoice</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/clients/create" className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/expenses/create" className="flex flex-col items-center gap-2">
                <Receipt className="h-6 w-6" />
                <span>Record Expense</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4" asChild>
              <Link href="/analytics" className="flex flex-col items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span>View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
