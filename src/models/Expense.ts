// src/models/Expense.ts

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category_id: string | null;
  category_name: string;
  date_incurred: string;
  payment_method: PaymentMethod;
  vendor_name?: string;
  receipt_number?: string;
  is_business_expense: boolean;
  tax_deductible: boolean;
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BalanceSummary {
  id?: string;
  total_earnings: number;
  total_expenses: number;
  current_balance: number;
  balance_start_date?: string;
  last_calculated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type PaymentMethod = 
  | 'cash'
  | 'upi'
  | 'card'
  | 'net_banking'
  | 'bank_transfer'
  | 'wallet'
  | 'cheque'
  | 'other';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: '💸' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
  { value: 'net_banking', label: 'Net Banking', icon: '🏦' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🔄' },
  { value: 'wallet', label: 'Digital Wallet', icon: '📲' },
  { value: 'cheque', label: 'Cheque', icon: '📄' },
  { value: 'other', label: 'Other', icon: '🔗' }
];

export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Office Supplies', icon: '🏢', color: '#3B82F6', is_default: true },
  { name: 'Transportation', icon: '🚗', color: '#10B981', is_default: true },
  { name: 'Technology', icon: '💻', color: '#8B5CF6', is_default: true },
  { name: 'Communication', icon: '📱', color: '#F59E0B', is_default: true },
  { name: 'Food & Entertainment', icon: '🍽️', color: '#EF4444', is_default: true },
  { name: 'Utilities', icon: '⚡', color: '#06B6D4', is_default: true },
  { name: 'Education & Training', icon: '📚', color: '#EC4899', is_default: true },
  { name: 'Healthcare', icon: '🏥', color: '#84CC16', is_default: true },
  { name: 'Marketing', icon: '📢', color: '#F97316', is_default: true },
  { name: 'Miscellaneous', icon: '📎', color: '#6B7280', is_default: true }
];

export interface ExpenseFilters {
  category?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  businessOnly?: boolean;
  searchTerm?: string;
}

export interface ExpenseAnalytics {
  totalExpenses: number;
  averageExpense: number;
  totalBusinessExpenses: number;
  totalTaxDeductible: number;
  expenseCount: number;
  topCategory: {
    name: string;
    amount: number;
    count: number;
  };
  categoryBreakdown: {
    name: string;
    amount: number;
    count: number;
    percentage: number;
    icon: string;
    color: string;
  }[];
  monthlyData: {
    month: string;
    amount: number;
    count: number;
  }[];
}