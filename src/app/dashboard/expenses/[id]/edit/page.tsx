'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getExpense } from '@/lib/supabase/queries';
import { ExpenseForm } from '@/features/expenses/components/expense-form';

export default function EditExpensePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const expenseId = params.id as string;

  const { data: expense, isLoading, error } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpense(expenseId),
    enabled: !!expenseId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Expense Not Found</h2>
          <p className="text-muted-foreground">The expense you're trying to edit doesn't exist or has been deleted.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/expenses')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push(`/dashboard/expenses/${expenseId}`)}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expense
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Receipt className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
              <p className="text-muted-foreground">
                Update details for {expense.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              expense.status === 'approved' ? 'bg-green-100 text-green-800' :
              expense.status === 'reimbursed' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {expense.status}
            </span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modify the expense information below. Changes will be saved when you submit the form.
          </p>
        </CardHeader>
        <CardContent>
          <ExpenseForm 
            expense={expense}
            mode="edit"
            onSuccess={() => {
              toast({
                title: 'Expense Updated',
                description: 'Expense has been updated successfully',
              });
              router.push(`/dashboard/expenses/${expenseId}`);
            }}
            onCancel={() => router.push(`/dashboard/expenses/${expenseId}`)}
          />
        </CardContent>
      </Card>

      {/* Status Information */}
      {expense.status !== 'pending' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-900">Status Notice</h3>
                <div className="text-sm text-orange-800">
                  {expense.status === 'approved' && (
                    <p>This expense has been approved. Changes may require re-approval.</p>
                  )}
                  {expense.status === 'reimbursed' && (
                    <p>This expense has been reimbursed. Contact finance before making changes.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Guidelines */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Receipt className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Edit Guidelines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Changes to approved expenses may require manager re-approval</li>
                <li>• Reimbursed expenses should only be edited for corrections</li>
                <li>• Always attach updated receipts if amounts change</li>
                <li>• Contact finance for questions about editing policies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
