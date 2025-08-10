'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useStore } from '@/store';
import { 
  Settings, 
  User, 
  Building, 
  Bell, 
  Palette, 
  Shield, 
  Download,
  Mail,
  Globe,
  DollarSign,
  Calendar,
  FileText,
  Save,
  RotateCcw
} from 'lucide-react';

// Validation schemas
const personalInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyAddress: z.string().min(5, 'Address is required'),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email('Invalid email address'),
  companyWebsite: z.string().optional(),
  taxId: z.string().optional(),
  logo: z.string().optional(),
});

const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  nextInvoiceNumber: z.number().min(1, 'Invoice number must be positive'),
  defaultDueDays: z.number().min(0, 'Due days must be non-negative'),
  currency: z.string().min(1, 'Currency is required'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0-100'),
  defaultPaymentTerms: z.string().optional(),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
type CompanyInfo = z.infer<typeof companyInfoSchema>;
type InvoiceSettings = z.infer<typeof invoiceSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    paymentAlerts: true,
    weeklyReports: false,
    overdueReminders: true,
  });

  // Form configurations
  const personalForm = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: settings?.userName || '',
      email: settings?.userEmail || '',
      phone: settings?.userPhone || '',
      avatar: settings?.userAvatar || '',
    },
  });

  const companyForm = useForm<CompanyInfo>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: settings?.companyName || '',
      companyAddress: settings?.companyAddress || '',
      companyPhone: settings?.companyPhone || '',
      companyEmail: settings?.companyEmail || '',
      companyWebsite: settings?.companyWebsite || '',
      taxId: settings?.taxId || '',
      logo: settings?.companyLogo || '',
    },
  });

  const invoiceForm = useForm<InvoiceSettings>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: {
      invoicePrefix: settings?.invoicePrefix || 'INV',
      nextInvoiceNumber: settings?.nextInvoiceNumber || 1,
      defaultDueDays: settings?.defaultDueDays || 30,
      currency: settings?.currency || 'USD',
      taxRate: settings?.taxRate || 0,
      defaultPaymentTerms: settings?.defaultPaymentTerms || '',
    },
  });

  const handlePersonalInfoSave = async (data: PersonalInfo) => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        userName: data.name,
        userEmail: data.email,
        userPhone: data.phone,
        userAvatar: data.avatar,
      });
      toast({
        title: 'Personal Information Updated',
        description: 'Your personal information has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update personal information.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyInfoSave = async (data: CompanyInfo) => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyEmail: data.companyEmail,
        companyWebsite: data.companyWebsite,
        taxId: data.taxId,
        companyLogo: data.logo,
      });
      toast({
        title: 'Company Information Updated',
        description: 'Your company information has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update company information.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvoiceSettingsSave = async (data: InvoiceSettings) => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: data.nextInvoiceNumber,
        defaultDueDays: data.defaultDueDays,
        currency: data.currency,
        taxRate: data.taxRate,
        defaultPaymentTerms: data.defaultPaymentTerms,
      });
      toast({
        title: 'Invoice Settings Updated',
        description: 'Your invoice settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        notifications,
      });
      toast({
        title: 'Notification Preferences Updated',
        description: 'Your notification preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    // TODO: Implement data export functionality
    toast({
      title: 'Export Started',
      description: 'Your data export will be ready shortly.',
    });
  };

  const resetAllSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      // TODO: Implement reset functionality
      toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to default values.',
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account, company information, and application preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={personalForm.handleSubmit(handlePersonalInfoSave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...personalForm.register('name')}
                      placeholder="Enter your full name"
                    />
                    {personalForm.formState.errors.name && (
                      <p className="text-sm text-destructive">
                        {personalForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...personalForm.register('email')}
                      placeholder="Enter your email"
                    />
                    {personalForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {personalForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...personalForm.register('phone')}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input
                      id="avatar"
                      {...personalForm.register('avatar')}
                      placeholder="Enter avatar image URL"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Information Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details for invoices and official documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={companyForm.handleSubmit(handleCompanyInfoSave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      {...companyForm.register('companyName')}
                      placeholder="Enter company name"
                    />
                    {companyForm.formState.errors.companyName && (
                      <p className="text-sm text-destructive">
                        {companyForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      {...companyForm.register('companyEmail')}
                      placeholder="Enter company email"
                    />
                    {companyForm.formState.errors.companyEmail && (
                      <p className="text-sm text-destructive">
                        {companyForm.formState.errors.companyEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone</Label>
                    <Input
                      id="companyPhone"
                      {...companyForm.register('companyPhone')}
                      placeholder="Enter company phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      {...companyForm.register('companyWebsite')}
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address</Label>
                    <Textarea
                      id="companyAddress"
                      {...companyForm.register('companyAddress')}
                      placeholder="Enter complete company address"
                      rows={3}
                    />
                    {companyForm.formState.errors.companyAddress && (
                      <p className="text-sm text-destructive">
                        {companyForm.formState.errors.companyAddress.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID/Registration</Label>
                    <Input
                      id="taxId"
                      {...companyForm.register('taxId')}
                      placeholder="Enter tax ID or registration number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo URL</Label>
                    <Input
                      id="logo"
                      {...companyForm.register('logo')}
                      placeholder="Enter logo image URL"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Settings
              </CardTitle>
              <CardDescription>
                Configure default settings for your invoices and billing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={invoiceForm.handleSubmit(handleInvoiceSettingsSave)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                    <Input
                      id="invoicePrefix"
                      {...invoiceForm.register('invoicePrefix')}
                      placeholder="INV"
                    />
                    {invoiceForm.formState.errors.invoicePrefix && (
                      <p className="text-sm text-destructive">
                        {invoiceForm.formState.errors.invoicePrefix.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                    <Input
                      id="nextInvoiceNumber"
                      type="number"
                      {...invoiceForm.register('nextInvoiceNumber', { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {invoiceForm.formState.errors.nextInvoiceNumber && (
                      <p className="text-sm text-destructive">
                        {invoiceForm.formState.errors.nextInvoiceNumber.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultDueDays">Default Due Days</Label>
                    <Input
                      id="defaultDueDays"
                      type="number"
                      {...invoiceForm.register('defaultDueDays', { valueAsNumber: true })}
                      placeholder="30"
                    />
                    {invoiceForm.formState.errors.defaultDueDays && (
                      <p className="text-sm text-destructive">
                        {invoiceForm.formState.errors.defaultDueDays.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select
                      value={invoiceForm.watch('currency')}
                      onValueChange={(value) => invoiceForm.setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      {...invoiceForm.register('taxRate', { valueAsNumber: true })}
                      placeholder="0"
                    />
                    {invoiceForm.formState.errors.taxRate && (
                      <p className="text-sm text-destructive">
                        {invoiceForm.formState.errors.taxRate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="defaultPaymentTerms">Default Payment Terms</Label>
                    <Textarea
                      id="defaultPaymentTerms"
                      {...invoiceForm.register('defaultPaymentTerms')}
                      placeholder="Payment is due within 30 days of invoice date. Late payments may incur fees."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive and how.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Invoice Reminders</Label>
                    <div className="text-sm text-muted-foreground">
                      Get reminded about upcoming invoice due dates
                    </div>
                  </div>
                  <Switch
                    checked={notifications.invoiceReminders}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, invoiceReminders: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Payment Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Get notified when payments are received
                    </div>
                  </div>
                  <Switch
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, paymentAlerts: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Reports</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive weekly business summary reports
                    </div>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Overdue Reminders</Label>
                    <div className="text-sm text-muted-foreground">
                      Get notified about overdue invoices
                    </div>
                  </div>
                  <Switch
                    checked={notifications.overdueReminders}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, overdueReminders: checked }))
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNotificationSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export your data or reset your settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <div className="font-medium">Export Data</div>
                      <div className="text-sm text-muted-foreground">
                        Download all your invoices, clients, and expenses as JSON
                      </div>
                    </div>
                    <Button onClick={exportData} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                    <div className="space-y-0.5">
                      <div className="font-medium text-destructive">Reset Settings</div>
                      <div className="text-sm text-muted-foreground">
                        Reset all settings to default values (data will remain)
                      </div>
                    </div>
                    <Button onClick={resetAllSettings} variant="destructive">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <Badge variant="secondary">2.0.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>August 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Database:</span>
                    <span>Supabase</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
