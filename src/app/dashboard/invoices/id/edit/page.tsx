'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInvoice } from '@/lib/supabase/queries';
import { InvoiceForm } from '@/features/invoices/components/invoice-form';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Invoice Not Found</h2>
          <p className="text-muted-foreground">The invoice you're looking for doesn't exist or has been deleted.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/invoices')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Update details for invoice #{invoice.invoice_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {invoice.status}
            </span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modify the invoice information below. Changes will be saved automatically.
          </p>
        </CardHeader>
        <CardContent>
          <InvoiceForm 
            invoice={invoice}
            mode="edit"
            onSuccess={() => {
              toast({
                title: 'Invoice Updated',
                description: 'Invoice has been updated successfully',
              });
              router.push(`/dashboard/invoices/${invoiceId}`);
            }}
            onCancel={() => router.push(`/dashboard/invoices/${invoiceId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
