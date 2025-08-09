import { InvoiceForm } from '@/features/invoices/components/invoice-form';

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-muted-foreground">Create a new invoice for your client</p>
      </div>
      
      <div className="bg-white rounded-lg border p-6">
        <InvoiceForm mode="create" />
      </div>
    </div>
  );
}