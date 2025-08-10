'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientForm } from '@/features/clients/components/client-form';

export default function CreateClientPage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push('/dashboard/clients')}
          variant="ghost"
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Client</h1>
            <p className="text-muted-foreground">
              Create a new client profile for your business
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the details below to create a new client profile. All fields marked with * are required.
          </p>
        </CardHeader>
        <CardContent>
          <ClientForm 
            mode="create"
            onSuccess={(clientId) => {
              toast({
                title: 'Client Created',
                description: 'New client has been added successfully',
              });
              router.push(`/dashboard/clients/${clientId}`);
            }}
            onCancel={() => router.push('/dashboard/clients')}
          />
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900">Client Management Tips</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Ensure all contact information is accurate for seamless communication</li>
                <li>• Add payment terms and preferred contact methods to streamline billing</li>
                <li>• Complete address information helps with tax and legal compliance</li>
                <li>• You can always edit client information later from their profile page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
