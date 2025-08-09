import { Badge } from '@/components/ui/badge';

interface InvoiceStatusBadgeProps {
  status: string;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const variant = {
    paid: 'success',
    pending: 'warning',
    overdue: 'destructive',
    draft: 'secondary',
    cancelled: 'secondary',
  }[status.toLowerCase()] || 'secondary';

  return (
    <Badge variant={variant as any}>
      {status}
    </Badge>
  );
}