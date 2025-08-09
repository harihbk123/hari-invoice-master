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
        <div className="text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-destructive">Invoice not found</div>
        <Button onClick={() => router.push('/invoices')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          onClick={() => router.push(`/invoices/${invoiceId}`)}
          variant="ghost"
          size="sm"
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoice
        </Button>
        <h1 className="text-3xl font-bold">Edit Invoice {invoice.invoice_number}</h1>
        <p className="text-muted-foreground">Update invoice details and line items</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm 
            invoice={invoice}
            onSuccess={() => {
              toast({
                title: 'Invoice Updated',
                description: 'Invoice has been updated successfully',
              });
              router.push(`/invoices/${invoiceId}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}