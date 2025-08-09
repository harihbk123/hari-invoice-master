import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserIcon, BuildingOfficeIcon, CreditCardIcon, CurrencyRupeeIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Settings {
  // Profile Settings
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileAddress: string;
  profileGSTIN: string;
  
  // Company Settings
  companyName: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyRegistration?: string;
  
  // Invoice Settings
  invoicePrefix: string;
  invoiceStartNumber: number;
  taxRate: number;
  currency: string;
  paymentTerms: string;
  invoiceNotes: string;
  
  // Banking Details
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIFSC: string;
  bankSWIFT?: string;
  bankBranch: string;
  accountType: string;
  upiId?: string;
  
  // Notification Settings
  emailNotifications: boolean;
  invoiceReminders: boolean;
  paymentAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
}

type SettingsTab = 'profile' | 'company' | 'invoice' | 'banking' | 'notifications' | 'security';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    profileName: '',
    profileEmail: '',
    profilePhone: '',
    profileAddress: '',
    profileGSTIN: '',
    companyName: '',
    companyLogo: '',
    companyWebsite: '',
    companyRegistration: '',
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    taxRate: 18,
    currency: 'INR',
    paymentTerms: 'Net 30',
    invoiceNotes: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    bankSWIFT: '',
    bankBranch: '',
    accountType: 'Current',
    upiId: '',
    emailNotifications: true,
    invoiceReminders: true,
    paymentAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          profileName: data.profile_name || '',
          profileEmail: data.profile_email || '',
          profilePhone: data.profile_phone || '',
          profileAddress: data.profile_address || '',
          profileGSTIN: data.profile_gstin || '',
          companyName: data.company_name || '',
          companyLogo: data.company_logo || '',
          companyWebsite: data.company_website || '',
          companyRegistration: data.company_registration || '',
          invoicePrefix: data.invoice_prefix || 'INV',
          invoiceStartNumber: data.invoice_start_number || 1,
          taxRate: data.tax_rate || 18,
          currency: data.currency || 'INR',
          paymentTerms: data.payment_terms || 'Net 30',
          invoiceNotes: data.invoice_notes || '',
          bankName: data.bank_name || '',
          bankAccountName: data.bank_account_name || '',
          bankAccountNumber: data.bank_account || '',
          bankIFSC: data.bank_ifsc || '',
          bankSWIFT: data.bank_swift || '',
          bankBranch: data.bank_branch || '',
          accountType: data.account_type || 'Current',
          upiId: data.upi_id || '',
          emailNotifications: data.email_notifications ?? true,
          invoiceReminders: data.invoice_reminders ?? true,
          paymentAlerts: data.payment_alerts ?? true,
          weeklyReports: data.weekly_reports ?? false,
          monthlyReports: data.monthly_reports ?? true,
          twoFactorAuth: data.two_factor_auth ?? false,
          sessionTimeout: data.session_timeout || 30,
          passwordExpiry: data.password_expiry || 90
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const settingsData = {
        user_id: 'default',
        profile_name: settings.profileName,
        profile_email: settings.profileEmail,
        profile_phone: settings.profilePhone,
        profile_address: settings.profileAddress,
        profile_gstin: settings.profileGSTIN,
        company_name: settings.companyName,
        company_logo: settings.companyLogo,
        company_website: settings.companyWebsite,
        company_registration: settings.companyRegistration,
        invoice_prefix: settings.invoicePrefix,
        invoice_start_number: settings.invoiceStartNumber,
        tax_rate: settings.taxRate,
        currency: settings.currency,
        payment_terms: settings.paymentTerms,
        invoice_notes: settings.invoiceNotes,
        bank_name: settings.bankName,
        bank_account_name: settings.bankAccountName,
        bank_account: settings.bankAccountNumber,
        bank_ifsc: settings.bankIFSC,
        bank_swift: settings.bankSWIFT,
        bank_branch: settings.bankBranch,
        account_type: settings.accountType,
        upi_id: settings.upiId,
        email_notifications: settings.emailNotifications,
        invoice_reminders: settings.invoiceReminders,
        payment_alerts: settings.paymentAlerts,
        weekly_reports: settings.weeklyReports,
        monthly_reports: settings.monthlyReports,
        two_factor_auth: settings.twoFactorAuth,
        session_timeout: settings.sessionTimeout,
        password_expiry: settings.passwordExpiry,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('settings')
        .upsert([settingsData], { onConflict: 'user_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: UserIcon },
    { id: 'company' as SettingsTab, label: 'Company', icon: BuildingOfficeIcon },
    { id: 'invoice' as SettingsTab, label: 'Invoice', icon: CurrencyRupeeIcon },
    { id: 'banking' as SettingsTab, label: 'Banking', icon: CreditCardIcon },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: BellIcon },
    { id: 'security' as SettingsTab, label: 'Security', icon: ShieldCheckIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences and configuration</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckIcon className="h-5 w-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={settings.profileName}
                    onChange={(e) => handleInputChange('profileName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={settings.profileEmail}
                    onChange={(e) => handleInputChange('profileEmail', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.profilePhone}
                    onChange={(e) => handleInputChange('profilePhone', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                  <input
                    type="text"
                    value={settings.profileGSTIN}
                    onChange={(e) => handleInputChange('profileGSTIN', e.target.value)}
                    placeholder="29ABCDE1234F1Z5"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    value={settings.profileAddress}
                    onChange={(e) => handleInputChange('profileAddress', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company Settings */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={settings.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                  <input
                    type="text"
                    value={settings.companyRegistration}
                    onChange={(e) => handleInputChange('companyRegistration', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                  <input
                    type="url"
                    value={settings.companyLogo}
                    onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Invoice Settings */}
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Invoice Configuration</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoicePrefix}
                    onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Starting Number</label>
                  <input
                    type="number"
                    value={settings.invoiceStartNumber}
                    onChange={(e) => handleInputChange('invoiceStartNumber', parseInt(e.target.value))}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                  <select
                    value={settings.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Default Invoice Notes</label>
                  <textarea
                    rows={3}
                    value={settings.invoiceNotes}
                    onChange={(e) => handleInputChange('invoiceNotes', e.target.value)}
                    placeholder="Thank you for your business!"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Banking Settings */}
          {activeTab === 'banking' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Banking Details</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                  <input
                    type="text"
                    value={settings.bankAccountName}
                    onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <input
                    type="text"
                    value={settings.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <select
                    value={settings.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                  <input
                    type="text"
                    value={settings.bankIFSC}
                    onChange={(e) => handleInputChange('bankIFSC', e.target.value)}
                    placeholder="ABCD0123456"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                  <input
                    type="text"
                    value={settings.bankBranch}
                    onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SWIFT Code (Optional)</label>
                  <input
                    type="text"
                    value={settings.bankSWIFT}
                    onChange={(e) => handleInputChange('bankSWIFT', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={settings.upiId}
                    onChange={(e) => handleInputChange('upiId', e.target.value)}
                    placeholder="yourname@upi"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Email Notifications</label>
                    <p className="text-gray-500 text-sm">Receive email notifications for important updates</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.invoiceReminders}
                      onChange={(e) => handleInputChange('invoiceReminders', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Invoice Reminders</label>
                    <p className="text-gray-500 text-sm">Get reminders for pending and overdue invoices</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.paymentAlerts}
                      onChange={(e) => handleInputChange('paymentAlerts', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Payment Alerts</label>
                    <p className="text-gray-500 text-sm">Notify when payments are received</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.weeklyReports}
                      onChange={(e) => handleInputChange('weeklyReports', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Weekly Reports</label>
                    <p className="text-gray-500 text-sm">Receive weekly business summary reports</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.monthlyReports}
                      onChange={(e) => handleInputChange('monthlyReports', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Monthly Reports</label>
                    <p className="text-gray-500 text-sm">Receive monthly financial reports</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label className="font-medium text-gray-700">Two-Factor Authentication</label>
                    <p className="text-gray-500 text-sm">Add an extra layer of security to your account</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="120"
                    className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Automatically log out after period of inactivity</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password Expiry (days)</label>
                  <input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                    min="30"
                    max="365"
                    className="mt-1 block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">Require password change after this period</p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Danger Zone</h4>
                  <div className="space-y-3">
                    <button className="btn btn-secondary text-red-600 hover:bg-red-50">
                      Change Password
                    </button>
                    <button className="btn btn-secondary text-red-600 hover:bg-red-50 ml-3">
                      Export All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn btn-primary flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}