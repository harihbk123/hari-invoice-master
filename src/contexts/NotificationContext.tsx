import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate, formatCurrency } from '../utils/format';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  metadata?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Load notifications from localStorage
    const stored = localStorage.getItem('notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    }

    // Set up real-time subscriptions for various events
    setupRealtimeSubscriptions();

    // Check for overdue invoices daily
    checkOverdueInvoices();
    const interval = setInterval(checkOverdueInvoices, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Save notifications to localStorage whenever they change
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to invoice changes
    const invoiceSubscription = supabase
      .channel('invoices')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => {
          handleInvoiceChange(payload);
        }
      )
      .subscribe();

    // Subscribe to payment changes
    const paymentSubscription = supabase
      .channel('payments')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices', filter: 'status=eq.Paid' },
        (payload) => {
          handlePaymentReceived(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoiceSubscription);
      supabase.removeChannel(paymentSubscription);
    };
  };

  const handleInvoiceChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      addNotification({
        type: 'info',
        title: 'New Invoice Created',
        message: `Invoice #${payload.new.id} for ${formatCurrency(payload.new.amount)} has been created`,
        action: {
          label: 'View Invoice',
          url: `/invoices/${payload.new.id}/edit`
        }
      });
    } else if (payload.eventType === 'UPDATE' && payload.new.status === 'Overdue') {
      addNotification({
        type: 'warning',
        title: 'Invoice Overdue',
        message: `Invoice #${payload.new.id} is now overdue`,
        action: {
          label: 'View Invoice',
          url: `/invoices/${payload.new.id}/edit`
        }
      });
    }
  };

  const handlePaymentReceived = (payload: any) => {
    addNotification({
      type: 'success',
      title: 'Payment Received',
      message: `Payment of ${formatCurrency(payload.new.amount)} received for Invoice #${payload.new.id}`,
      action: {
        label: 'View Details',
        url: `/invoices/${payload.new.id}/edit`
      }
    });
  };

  const checkOverdueInvoices = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('*')
      .neq('status', 'Paid')
      .lt('due_date', today);

    if (overdueInvoices && overdueInvoices.length > 0) {
      addNotification({
        type: 'warning',
        title: 'Overdue Invoices',
        message: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} requiring attention`,
        action: {
          label: 'View Overdue Invoices',
          url: '/invoices?filter=overdue'
        }
      });
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-dismiss success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        markAsRead(newNotification.id);
      }, 5000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Notification Toast Component
export function NotificationToast() {
  const { notifications, markAsRead, removeNotification } = useNotifications();
  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 3);

  if (unreadNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {unreadNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 ${
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'error' ? 'border-red-500' :
            notification.type === 'warning' ? 'border-yellow-500' :
            'border-blue-500'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' && (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              )}
              {notification.type === 'error' && (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
              {notification.type === 'warning' && (
                <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
              )}
              {notification.type === 'info' && (
                <InformationCircleIcon className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </p>
              {notification.message && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {notification.message}
                </p>
              )}
              {notification.action && (
                <a
                  href={notification.action.url}
                  className="mt-2 text-sm font-medium text-primary hover:underline inline-block"
                  onClick={() => markAsRead(notification.id)}
                >
                  {notification.action.label} →
                </a>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Notification Center Component
export function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary hover:underline"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.type === 'success' && (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    )}
                    {notification.type === 'error' && (
                      <XCircleIcon className="h-5 w-5 text-red-500" />
                    )}
                    {notification.type === 'warning' && (
                      <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                    )}
                    {notification.type === 'info' && (
                      <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${
                      !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {notification.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(notification.timestamp)}
                    </p>
                    {notification.action && (
                      <a
                        href={notification.action.url}
                        className="mt-2 text-sm font-medium text-primary hover:underline inline-block"
                      >
                        {notification.action.label} →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}