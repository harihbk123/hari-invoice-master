'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceStore } from '@/lib/store';
import { getInvoice, updateInvoiceStatus } from '@/lib/supabase/queries';
import { generateInvoicePDF } from '@/features/invoices/lib/pdf-generator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { Edit, Download, Send, Printer, ArrowLeft, Trash2 } from 'lucide-react';
import type { InvoiceStatus } from '@/types';

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const invoiceId = params.id as string;
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const { deleteInvoice } = useInvoiceStore();

  const { data: invoice, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
    if (!invoice || invoice.status === newStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateInvoiceStatus(invoiceId, newStatus);
      await refetch();
      toast({
        title: 'Status Updated',
        description: `Invoice status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    
    try {
      generateInvoicePDF(invoice);
      toast({
        title: 'PDF Downloaded',
        description: 'Invoice PDF has been downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    // TODO: Implement email functionality
    toast({
      title: 'Coming Soon',
      description: 'Email functionality will be available soon',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    setIsDeletingInvoice(true);
    try {
      await deleteInvoice(invoiceId);
      toast({
        title: 'Invoice Deleted',
        description: 'Invoice has been deleted successfully',
      });
      router.push('/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingInvoice(false);
    }
  };

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

  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (invoice.tax_rate / 100);
  const total = subtotal + tax;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button
            onClick={() => router.push('/invoices')}
            variant="ghost"
            size="sm"
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number}</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push(`/invoices/${invoiceId}/edit`)}
            variant="outline"
            size="sm"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleSendEmail} variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="sm"
            disabled={isDeletingInvoice}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Info */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <div className="flex items-center gap-2">
                <InvoiceStatusBadge status={invoice.status} />
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
                  disabled={isUpdatingStatus}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue Date</span>
              <span>{formatDate(invoice.date_issued)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms</span>
              <span>{invoice.payment_terms || 'Net 30'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium">{invoice.client?.name}</div>
              {invoice.client?.email && (
                <div className="text-sm text-muted-foreground">{invoice.client.email}</div>
              )}
              {invoice.client?.phone && (
                <div className="text-sm text-muted-foreground">{invoice.client.phone}</div>
              )}
            </div>
            {invoice.client?.address && (
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {invoice.client.address}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}