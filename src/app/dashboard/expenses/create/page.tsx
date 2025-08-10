'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ExpenseForm } from '@/features/expenses/components/expense-form';

export default function CreateExpensePage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push('/dashboard/expenses')}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Receipt className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Expense</h1>
            <p className="text-muted-foreground">
              Record a new business expense for tracking and reimbursement
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the information below to record a new expense. All fields marked with * are required.
          </p>
        </CardHeader>
        <CardContent>
          <ExpenseForm 
            mode="create"
            onSuccess={(expenseId) => {
              toast({
                title: 'Expense Created',
                description: 'New expense has been recorded successfully',
              });
              router.push(`/dashboard/expenses/${expenseId}`);
            }}
            onCancel={() => router.push('/dashboard/expenses')}
          />
        </CardContent>
      </Card>

      {/* Help Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">Expense Categories</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Office Supplies:</strong> Stationery, software licenses</li>
                  <li>• <strong>Travel:</strong> Transportation, accommodation</li>
                  <li>• <strong>Meals:</strong> Business meals and entertainment</li>
                  <li>• <strong>Equipment:</strong> Hardware, furniture purchases</li>
                  <li>• <strong>Marketing:</strong> Advertising, promotional materials</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-green-900">Reimbursement Tips</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Mark personal expenses as reimbursable</li>
                  <li>• Attach receipts for amounts over $25</li>
                  <li>• Submit expenses within 30 days</li>
                  <li>• Include detailed descriptions for clarity</li>
                  <li>• Business meals require attendee information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Need Help?</h3>
              <p className="text-sm text-gray-600">
                Check our expense policy or contact finance for questions about reimbursements.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Policy
              </Button>
              <Button variant="outline" size="sm">
                Contact Finance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
