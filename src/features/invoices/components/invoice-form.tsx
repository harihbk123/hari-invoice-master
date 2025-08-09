'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineItemsForm } from './line-items-form';
import { useClients } from '@/features/clients/hooks/use-clients';
import { useSettings } from '@/features/settings/hooks/use-settings';
import { useCreateInvoice, useUpdateInvoice, useNextInvoiceNumber } from '../hooks/use-invoices';
import { Invoice, LineItem } from '@/types';
import { generateInvoiceNumber, getDueDateFromTerms } from '@/lib/utils';

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled']),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  mode: 'create' | 'edit';
}

export function InvoiceForm({ invoice, mode }: InvoiceFormProps) {
  const router = useRouter();
  const { clients } = useClients();
  const { settings } = useSettings();
  const { data: nextNumber } = useNextInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.items || [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: invoice?.client_id || '',
      date: invoice?.date_issued || new Date().toISOString().split('T')[0],
      dueDate: invoice?.due_date || '',
      status: invoice?.status || 'Draft',
    },
  });

  const selectedClientId = watch('clientId');
  const issueDate = watch('date');

  // Auto-calculate due date based on client payment terms
  useEffect(() => {
    if (selectedClientId && issueDate && !invoice) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client) {
        const dueDate = getDueDateFromTerms(new Date(issueDate), client.payment_terms);
        setValue('dueDate', dueDate.toISOString().split('T')[0]);
      }
    }
  }, [selectedClientId, issueDate, clients, setValue, invoice]);

  const onSubmit = async (data: InvoiceFormData) => {
    const client = clients.find(c => c.id === data.clientId);
    if (!client) return;

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (settings?.tax_rate || 0) / 100;
    const total = subtotal + tax;

    const invoiceData = {
      client_id: data.clientId,
      client_name: client.name,
      amount: total,
      subtotal,
      tax,
      date_issued: data.date,
      due_date: data.dueDate,
      status: data.status,
      items: lineItems,
    };

    if (mode === 'create') {
      const invoiceNumber = generateInvoiceNumber(
        settings?.invoice_prefix || 'INV',
        nextNumber || 1
      );
      await createInvoice.mutateAsync({ ...invoiceData, id: invoiceNumber });
    } else if (invoice) {
      await updateInvoice.mutateAsync({ id: invoice.id, data: invoiceData });
    }

    router.push('/invoices');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="client">Client</Label>
          <Select
            value={watch('clientId')}
            onValueChange={(value) => setValue('clientId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.clientId && (
            <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date">Issue Date</Label>
          <Input
            type="date"
            {...register('date')}
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            type="date"
            {...register('dueDate')}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && (
            <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
          )}
        </div>
      </div>

      {mode === 'edit' && (
        <div className="w-full md:w-1/3">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch('status')}
            onValueChange={(value: any) => setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <LineItemsForm
        items={lineItems}
        onChange={setLineItems}
        taxRate={settings?.tax_rate || 0}
      />

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/invoices')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createInvoice.isPending || updateInvoice.isPending}>
          {createInvoice.isPending || updateInvoice.isPending
            ? 'Saving...'
            : mode === 'create'
            ? 'Create Invoice'
            : 'Update Invoice'}
        </Button>
      </div>
    </form>
  );
}