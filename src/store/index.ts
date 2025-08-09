import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  Client, 
  Invoice, 
  Expense, 
  ExpenseCategory, 
  Settings,
  BalanceSummary,
  DateRange,
  PaymentMethod 
} from '@/types'

interface AppState {
  // User & Settings
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
  sidebarOpen: boolean
  
  // Selected Items
  selectedInvoiceId: string | null
  selectedClientId: string | null
  selectedExpenseId: string | null
  
  // Filters
  invoiceFilter: Invoice['status'] | 'all'
  expenseFilter: {
    category: string | 'all'
    dateRange: DateRange
    paymentMethod: PaymentMethod | 'all'
    businessOnly: boolean
  }
}

interface AppActions {
  // User Actions
  setUser: (user: any) => void
  setSettings: (settings: Settings) => void
  logout: () => void
  
  // Data Actions
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
  
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  
  setExpenseCategories: (categories: ExpenseCategory[]) => void
  setBalanceSummary: (summary: BalanceSummary) => void
  
  // UI Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  toggleSidebar: () => void
  
  // Selection Actions
  selectInvoice: (id: string | null) => void
  selectClient: (id: string | null) => void
  selectExpense: (id: string | null) => void
  
  // Filter Actions
  setInvoiceFilter: (filter: Invoice['status'] | 'all') => void
  setExpenseFilter: (filter: Partial<AppState['expenseFilter']>) => void
  resetFilters: () => void
  
  // Computed Values
  getClientById: (id: string) => Client | undefined
  getInvoiceById: (id: string) => Invoice | undefined
  getExpenseById: (id: string) => Expense | undefined
  getFilteredInvoices: () => Invoice[]
  getFilteredExpenses: () => Expense[]
  getTotalEarnings: () => number
  getTotalExpenses: () => number
  getCurrentBalance: () => number
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  user: null,
  settings: null,
  clients: [],
  invoices: [],
  expenses: [],
  expenseCategories: [],
  balanceSummary: null,
  isLoading: false,
  error: null,
  sidebarOpen: true,
  selectedInvoiceId: null,
  selectedClientId: null,
  selectedExpenseId: null,
  invoiceFilter: 'all',
  expenseFilter: {
    category: 'all',
    dateRange: { from: undefined, to: undefined },
    paymentMethod: 'all',
    businessOnly: false,
  },
}

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // User Actions
        setUser: (user) => set({ user }),
        setSettings: (settings) => set({ settings }),
        logout: () => set(initialState),

        // Data Actions - Clients
        setClients: (clients) => set({ clients }),
        addClient: (client) => set((state) => ({ 
          clients: [...state.clients, client] 
        })),
        updateClient: (id, updates) => set((state) => ({
          clients: state.clients.map((c) => 
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
        deleteClient: (id) => set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

        // Data Actions - Invoices
        setInvoices: (invoices) => set({ invoices }),
        addInvoice: (invoice) => set((state) => ({ 
          invoices: [...state.invoices, invoice] 
        })),
        updateInvoice: (id, updates) => set((state) => ({
          invoices: state.invoices.map((i) => 
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
        deleteInvoice: (id) => set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        })),

        // Data Actions - Expenses
        setExpenses: (expenses) => set({ expenses }),
        addExpense: (expense) => set((state) => ({ 
          expenses: [...state.expenses, expense] 
        })),
        updateExpense: (id, updates) => set((state) => ({
          expenses: state.expenses.map((e) => 
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
        deleteExpense: (id) => set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

        setExpenseCategories: (expenseCategories) => set({ expenseCategories }),
        setBalanceSummary: (balanceSummary) => set({ balanceSummary }),

        // UI Actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),

        // Selection Actions
        selectInvoice: (selectedInvoiceId) => set({ selectedInvoiceId }),
        selectClient: (selectedClientId) => set({ selectedClientId }),
        selectExpense: (selectedExpenseId) => set({ selectedExpenseId }),

        // Filter Actions
        setInvoiceFilter: (invoiceFilter) => set({ invoiceFilter }),
        setExpenseFilter: (filter) => set((state) => ({
          expenseFilter: { ...state.expenseFilter, ...filter },
        })),
        resetFilters: () => set({
          invoiceFilter: 'all',
          expenseFilter: initialState.expenseFilter,
        }),

        // Computed Values
        getClientById: (id) => {
          return get().clients.find((c) => c.id === id)
        },
        
        getInvoiceById: (id) => {
          return get().invoices.find((i) => i.id === id)
        },
        
        getExpenseById: (id) => {
          return get().expenses.find((e) => e.id === id)
        },
        
        getFilteredInvoices: () => {
          const { invoices, invoiceFilter } = get()
          if (invoiceFilter === 'all') return invoices
          return invoices.filter((i) => i.status === invoiceFilter)
        },
        
        getFilteredExpenses: () => {
          const { expenses, expenseFilter } = get()
          let filtered = [...expenses]
          
          if (expenseFilter.category !== 'all') {
            filtered = filtered.filter((e) => e.category_id === expenseFilter.category)
          }
          
          if (expenseFilter.paymentMethod !== 'all') {
            filtered = filtered.filter((e) => e.payment_method === expenseFilter.paymentMethod)
          }
          
          if (expenseFilter.businessOnly) {
            filtered = filtered.filter((e) => e.is_business_expense)
          }
          
          if (expenseFilter.dateRange.from && expenseFilter.dateRange.to) {
            filtered = filtered.filter((e) => {
              const date = new Date(e.date_incurred)
              return date >= expenseFilter.dateRange.from! && date <= expenseFilter.dateRange.to!
            })
          }
          
          return filtered
        },
        
        getTotalEarnings: () => {
          return get().invoices
            .filter((i) => i.status === 'Paid')
            .reduce((sum, i) => sum + i.amount, 0)
        },
        
        getTotalExpenses: () => {
          return get().expenses.reduce((sum, e) => sum + e.amount, 0)
        },
        
        getCurrentBalance: () => {
          const earnings = get().getTotalEarnings()
          const expenses = get().getTotalExpenses()
          return earnings - expenses
        },
      }),
      {
        name: 'invoice-manager-store',
        partialize: (state) => ({
          user: state.user,
          settings: state.settings,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    )
  )
)

// Selectors for common use cases
export const useUser = () => useStore((state) => state.user)
export const useSettings = () => useStore((state) => state.settings)
export const useClients = () => useStore((state) => state.clients)
export const useInvoices = () => useStore((state) => state.invoices)
export const useExpenses = () => useStore((state) => state.expenses)
export const useIsLoading = () => useStore((state) => state.isLoading)