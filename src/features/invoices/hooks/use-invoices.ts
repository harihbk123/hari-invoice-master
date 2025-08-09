import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice, InvoiceFormData } from '@/types';
import { 
  getInvoices, 
  getInvoice, 
  createInvoice, 
  updateInvoice, 
  deleteInvoice,
  changeInvoiceStatus,
  getNextInvoiceNumber
} from '@/lib/supabase/queries';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store';

export function useInvoices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setInvoices = useStore((state) => state.setInvoices);

  const query = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const data = await getInvoices();
      setInvoices(data);
      return data;
    },
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addInvoice = useStore((state) => state.addInvoice);

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      addInvoice(data);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast({
        title: 'Success',
        description: `Invoice ${data.id} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateInvoiceInStore = useStore((state) => state.updateInvoice);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceFormData }) =>
      updateInvoice(id, data),
    onSuccess: (data) => {
      updateInvoiceInStore(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const removeInvoice = useStore((state) => state.removeInvoice);

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: (_, id) => {
      removeInvoice(id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });
}

export function useChangeInvoiceStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      changeInvoiceStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast({
        title: 'Success',
        description: `Invoice status changed to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change invoice status',
        variant: 'destructive',
      });
    },
  });
}

export function useNextInvoiceNumber() {
  return useQuery({
    queryKey: ['nextInvoiceNumber'],
    queryFn: getNextInvoiceNumber,
  });
}