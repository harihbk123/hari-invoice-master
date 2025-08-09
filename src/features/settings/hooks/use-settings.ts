import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '@/types';
import { getSettings, updateSettings } from '@/lib/supabase/queries';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store';

export function useSettings() {
  const setSettings = useStore((state) => state.setSettings);

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const data = await getSettings();
      setSettings(data);
      return data;
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setSettings = useStore((state) => state.setSettings);

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      setSettings(data);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });
}