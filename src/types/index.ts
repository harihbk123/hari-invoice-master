// Database Types (matching your Supabase schema)

export interface Client {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  payment_terms: 'net15' | 'net30' | 'net45' | 'due_on_receipt'
  contact_name?: string | null
  company?: string | null
  total_invoices: number
  total_amount: number
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  client_id: string
  client_name: string
  amount: number
  subtotal: number
  tax: number
  date_issued: string
  due_date: string
  status: 'Draft' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
  items: InvoiceItem[]
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string | null
  icon: string
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  category_id?: string | null
  category_name?: string | null
  date_incurred: string
  payment_method: PaymentMethod
  vendor_name?: string | null
  receipt_number?: string | null
  is_business_expense: boolean
  tax_deductible: boolean
  notes?: string | null
  tags?: string[] | null
  created_at: string
  updated_at: string
}

export type PaymentMethod = 
  | 'cash' 
  | 'upi' 
  | 'card' 
  | 'net_banking' 
  | 'bank_transfer' 
  | 'wallet' 
  | 'cheque' 
  | 'other'

export interface BalanceSummary {
  id: string
  total_earnings: number
  total_expenses: number
  current_balance: number
  balance_start_date?: string | null
  last_calculated_at: string
  created_at: string
  updated_at: string
}

export interface Settings {
  user_id: string
  currency: string
  tax_rate: number
  invoice_prefix: string
  profile_name?: string | null
  profile_email?: string | null
  profile_phone?: string | null
  profile_address?: string | null
  profile_gstin?: string | null
  bank_account_name?: string | null
  bank_name?: string | null
  bank_account?: string | null
  bank_branch?: string | null
  bank_ifsc?: string | null
  bank_swift?: string | null
  account_type?: string | null
  created_at: string
  updated_at: string
}

// Form Types
export interface ClientFormData {
  name: string
  email: string
  phone?: string
  address?: string
  payment_terms: Client['payment_terms']
  contact_name?: string
  company?: string
}

export interface InvoiceFormData {
  client_id: string
  date_issued: string
  due_date: string
  items: InvoiceItem[]
  status: Invoice['status']
}

export interface ExpenseFormData {
  amount: number
  description: string
  category_id?: string
  date_incurred: string
  payment_method: PaymentMethod
  vendor_name?: string
  receipt_number?: string
  is_business_expense: boolean
  tax_deductible: boolean
  notes?: string
  tags?: string[]
}

// Analytics Types
export interface MonthlyEarnings {
  month: string
  amount: number
}

export interface ClientRevenue {
  client_id: string
  client_name: string
  total_amount: number
  invoice_count: number
}

export interface ExpenseAnalytics {
  total_expenses: number
  average_expense: number
  total_business_expenses: number
  total_tax_deductible: number
  expense_count: number
  top_category: {
    name: string
    amount: number
  }
  category_breakdown: Array<{
    name: string
    amount: number
    count: number
    color: string
    icon: string
  }>
  monthly_data: Array<{
    month: string
    amount: number
  }>
}

// UI Types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface FilterOption {
  value: string
  label: string
  icon?: React.ReactNode
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

// Store Types
export interface AppState {
  // User
  user: any | null
  settings: Settings | null
  
  // Data
  clients: Client[]
  invoices: Invoice[]
  expenses: Expense[]
  expenseCategories: ExpenseCategory[]
  balanceSummary: BalanceSummary | null
  
  // UI State
  isLoading: boolean
  error: string | null
  selectedInvoiceId: string | null
  selectedClientId: string | null
  selectedExpenseId: string | null
  
  // Filters
  invoiceFilter: Invoice['status'] | 'all'
  expenseFilter: {
    category: string | 'all'
    dateRange: DateRange
    paymentMethod: PaymentMethod | 'all'
  }
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}