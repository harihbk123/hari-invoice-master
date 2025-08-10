'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getClient } from '@/lib/supabase/queries';
import { ClientForm } from '@/features/clients/components/client-form';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const clientId = params.id as string;

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
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

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Client Not Found</h2>
          <p className="text-muted-foreground">The client you're trying to edit doesn't exist or has been deleted.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push(`/dashboard/clients/${clientId}`)}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update information for {client.name}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Modify the client information below. Changes will be saved when you submit the form.
          </p>
        </CardHeader>
        <CardContent>
          <ClientForm 
            client={client}
            mode="edit"
            onSuccess={() => {
              toast({
                title: 'Client Updated',
                description: 'Client information has been updated successfully',
              });
              router.push(`/dashboard/clients/${clientId}`);
            }}
            onCancel={() => router.push(`/dashboard/clients/${clientId}`)}
          />
        </CardContent>
      </Card>

      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-900">Important Notes</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Changes to client information will not affect existing invoices</li>
                <li>• Updated contact details will be used for future communications</li>
                <li>• Address changes will apply to new invoices created after saving</li>
                <li>• Make sure all information is accurate before saving</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
