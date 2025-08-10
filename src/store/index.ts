import { create } from 'zustand'
import { dbHelpers } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Client = Database['public']['Tables']['clients']['Row']
type Invoice = Database['public']['Tables']['invoices']['Row']
type Expense = Database['public']['Tables']['expenses']['Row']
type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row']
type Settings = Database['public']['Tables']['settings']['Row']
type BalanceSummary = Database['public']['Tables']['balance_summary']['Row']

interface User {
  id: string
  email: string
  name: string
}

interface InvoiceItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface StoreState {
  // User
  user: User | null
  setUser: (user: User | null) => void

  // Data
  clients: Client[]
  invoices: Invoice[]
  expenses: Expense[]
  expenseCategories: ExpenseCategory[]
  settings: Settings | null
  balanceSummary: BalanceSummary | null

  // Loading states
  isLoading: boolean
  isLoadingClients: boolean
  isLoadingInvoices: boolean
  isLoadingExpenses: boolean

  // Actions
  setLoading: (loading: boolean) => void
  loadInitialData: () => Promise<void>
  
  // Client actions
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  removeClient: (id: string) => void
  
  // Invoice actions
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  removeInvoice: (id: string) => void
  
  // Expense actions
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  updateExpense: (id: string, updates: Partial<Expense>) => void
  removeExpense: (id: string) => void
  
  // Settings actions
  setSettings: (settings: Settings) => void
  updateSettings: (updates: Partial<Settings>) => void
  
  // Balance actions
  setBalanceSummary: (summary: BalanceSummary) => void
  updateBalanceSummary: (updates: Partial<BalanceSummary>) => void
  
  // Computed values
  getTotalEarnings: () => number
  getTotalExpenses: () => number
  getCurrentBalance: () => number
  getRecentInvoices: (limit?: number) => Invoice[]
  getRecentExpenses: (limit?: number) => Expense[]
  getOverdueInvoices: () => Invoice[]
  
  // Reset store
  reset: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  user: null,
  clients: [],
  invoices: [],
  expenses: [],
  expenseCategories: [],
  settings: null,
  balanceSummary: null,
  isLoading: false,
  isLoadingClients: false,
  isLoadingInvoices: false,
  isLoadingExpenses: false,

  // Basic setters
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setClients: (clients) => set({ clients }),
  setInvoices: (invoices) => set({ invoices }),
  setExpenses: (expenses) => set({ expenses }),
  setSettings: (settings) => set({ settings }),
  setBalanceSummary: (balanceSummary) => set({ balanceSummary }),

  // Load initial data
  loadInitialData: async () => {
    set({ isLoading: true })
    
    try {
      // Load all data in parallel
      const [
        clientsResult,
        invoicesResult,
        expensesResult,
        categoriesResult,
        balanceResult
      ] = await Promise.all([
        dbHelpers.getClients(),
        dbHelpers.getInvoices(),
        dbHelpers.getExpenses(),
        dbHelpers.getExpenseCategories(),
        dbHelpers.getBalanceSummary()
      ])

      if (clientsResult.data) set({ clients: clientsResult.data })
      if (invoicesResult.data) set({ invoices: invoicesResult.data })
      if (expensesResult.data) set({ expenses: expensesResult.data })
      if (categoriesResult.data) set({ expenseCategories: categoriesResult.data })
      if (balanceResult.data) set({ balanceSummary: balanceResult.data })

      // Load user settings if user exists
      const { user } = get()
      if (user) {
        const settingsResult = await dbHelpers.getSettings(user.id)
        if (settingsResult.data) {
          set({ settings: settingsResult.data })
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Client actions
  addClient: (client) => set((state) => ({
    clients: [client, ...state.clients]
  })),

  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(client => 
      client.id === id ? { ...client, ...updates } : client
    )
  })),

  removeClient: (id) => set((state) => ({
    clients: state.clients.filter(client => client.id !== id)
  })),

  // Invoice actions
  addInvoice: (invoice) => set((state) => ({
    invoices: [invoice, ...state.invoices]
  })),

  updateInvoice: (id, updates) => set((state) => ({
    invoices: state.invoices.map(invoice => 
      invoice.id === id ? { ...invoice, ...updates } : invoice
    )
  })),

  removeInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter(invoice => invoice.id !== id)
  })),

  // Expense actions
  addExpense: (expense) => set((state) => ({
    expenses: [expense, ...state.expenses]
  })),

  updateExpense: (id, updates) => set((state) => ({
    expenses: state.expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    )
  })),

  removeExpense: (id) => set((state) => ({
    expenses: state.expenses.filter(expense => expense.id !== id)
  })),

  // Settings actions
  updateSettings: (updates) => set((state) => ({
    settings: state.settings ? { ...state.settings, ...updates } : null
  })),

  // Balance actions
  updateBalanceSummary: (updates) => set((state) => ({
    balanceSummary: state.balanceSummary ? { ...state.balanceSummary, ...updates } : null
  })),

  // Computed values
  getTotalEarnings: () => {
    const { invoices } = get()
    return invoices
      .filter(invoice => invoice.status === 'Paid')
      .reduce((total, invoice) => total + invoice.amount, 0)
  },

  getTotalExpenses: () => {
    const { expenses } = get()
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  },

  getCurrentBalance: () => {
    const { getTotalEarnings, getTotalExpenses } = get()
    return getTotalEarnings() - getTotalExpenses()
  },

  getRecentInvoices: (limit = 5) => {
    const { invoices } = get()
    return invoices
      .slice()
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, limit)
  },

  getRecentExpenses: (limit = 5) => {
    const { expenses } = get()
    return expenses
      .slice()
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, limit)
  },

  getOverdueInvoices: () => {
    const { invoices } = get()
    const today = new Date()
    return invoices.filter(invoice => 
      invoice.status === 'Pending' && 
      new Date(invoice.due_date) < today
    )
  },

  // Reset store
  reset: () => set({
    user: null,
    clients: [],
    invoices: [],
    expenses: [],
    expenseCategories: [],
    settings: null,
    balanceSummary: null,
    isLoading: false,
    isLoadingClients: false,
    isLoadingInvoices: false,
    isLoadingExpenses: false,
  })
}))
