import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, ClientFormData } from '@/types';
import { 
  getClients, 
  getClient, 
  createClient, 
  updateClient, 
  deleteClient 
} from '@/lib/supabase/queries';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store';

export function useClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setClients = useStore((state) => state.setClients);

  const query = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await getClients();
      setClients(data);
      return data;
    },
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addClient = useStore((state) => state.addClient);

  return useMutation({
    mutationFn: createClient,
    onSuccess: (data) => {
      addClient(data);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create client',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateClientInStore = useStore((state) => state.updateClient);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      updateClient(id, data),
    onSuccess: (data) => {
      updateClientInStore(data.id, data);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data.id] });
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const removeClient = useStore((state) => state.removeClient);

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: (_, id) => {
      removeClient(id);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      });
    },
  });
}