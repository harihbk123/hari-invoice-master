import { supabase } from './client'
import type { 
  Client, 
  Invoice, 
  Expense, 
  ExpenseCategory, 
  Settings,
  ClientFormData,
  InvoiceFormData,
  ExpenseFormData,
  BalanceSummary
} from '@/types'

// ============ CLIENT QUERIES ============

export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as Client[]
}

export const getClient = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Client
}

export const createClient = async (client: ClientFormData) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      ...client,
      total_invoices: 0,
      total_amount: 0
    }])
    .select()
    .single()
  
  if (error) throw error
  return data as Client
}

export const updateClient = async (id: string, updates: Partial<ClientFormData>) => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Client
}

export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ============ INVOICE QUERIES ============

export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('date_issued', { ascending: false })
  
  if (error) throw error
  return data as Invoice[]
}

export const getInvoice = async (id: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Invoice
}

export const createInvoice = async (invoice: InvoiceFormData & { id: string }) => {
  // Get client name
  const client = await getClient(invoice.client_id)
  
  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0)
  const settings = await getSettings()
  const tax = subtotal * (settings?.tax_rate || 0) / 100
  const amount = subtotal + tax
  
  const { data, error } = await supabase
    .from('invoices')
    .insert([{
      ...invoice,
      client_name: client.name,
      subtotal,
      tax,
      amount
    }])
    .select()
    .single()
  
  if (error) throw error
  
  // Update client totals
  await updateClientTotals(invoice.client_id)
  
  return data as Invoice
}

export const updateInvoice = async (id: string, updates: Partial<InvoiceFormData>) => {
  let updateData: any = { ...updates }
  
  // Recalculate totals if items changed
  if (updates.items) {
    const subtotal = updates.items.reduce((sum, item) => sum + item.amount, 0)
    const settings = await getSettings()
    const tax = subtotal * (settings?.tax_rate || 0) / 100
    const amount = subtotal + tax
    
    updateData = {
      ...updateData,
      subtotal,
      tax,
      amount
    }
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Update client totals if status changed to/from Paid
  const invoice = data as Invoice
  if (updates.status) {
    await updateClientTotals(invoice.client_id)
  }
  
  return invoice
}

export const deleteInvoice = async (id: string) => {
  // Get invoice to know which client to update
  const invoice = await getInvoice(id)
  
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // Update client totals
  await updateClientTotals(invoice.client_id)
}

export const updateClientTotals = async (clientId: string) => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('amount, status')
    .eq('client_id', clientId)
  
  const totalInvoices = invoices?.length || 0
  const totalAmount = invoices
    ?.filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0) || 0
  
  await supabase
    .from('clients')
    .update({
      total_invoices: totalInvoices,
      total_amount: totalAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
}

// ============ EXPENSE QUERIES ============

export const getExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date_incurred', { ascending: false })
  
  if (error) throw error
  return data as Expense[]
}

export const getExpense = async (id: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Expense
}

export const createExpense = async (expense: ExpenseFormData) => {
  // Get category name if category_id provided
  let category_name = null
  if (expense.category_id) {
    const category = await getExpenseCategory(expense.category_id)
    category_name = category.name
  }
  
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      ...expense,
      category_name
    }])
    .select()
    .single()
  
  if (error) throw error
  
  // Update balance summary
  await updateBalanceSummary()
  
  return data as Expense
}

export const updateExpense = async (id: string, updates: Partial<ExpenseFormData>) => {
  let updateData: any = { ...updates }
  
  // Update category name if category changed
  if (updates.category_id) {
    const category = await getExpenseCategory(updates.category_id)
    updateData.category_name = category.name
  }
  
  const { data, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  // Update balance summary
  await updateBalanceSummary()
  
  return data as Expense
}

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // Update balance summary
  await updateBalanceSummary()
}

// ============ EXPENSE CATEGORY QUERIES ============

export const getExpenseCategories = async () => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as ExpenseCategory[]
}

export const getExpenseCategory = async (id: string) => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ExpenseCategory
}

export const createExpenseCategory = async (category: Partial<ExpenseCategory>) => {
  const { data, error } = await supabase
    .from('expense_categories')
    .insert([category])
    .select()
    .single()
  
  if (error) throw error
  return data as ExpenseCategory
}

// ============ SETTINGS QUERIES ============

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', 'default')
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data as Settings | null
}

export const updateSettings = async (settings: Partial<Settings>) => {
  const existing = await getSettings()
  
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update(settings)
      .eq('user_id', 'default')
      .select()
      .single()
    
    if (error) throw error
    return data as Settings
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert([{
        user_id: 'default',
        ...settings
      }])
      .select()
      .single()
    
    if (error) throw error
    return data as Settings
  }
}

// ============ BALANCE SUMMARY QUERIES ============

export const getBalanceSummary = async () => {
  const { data, error } = await supabase
    .from('balance_summary')
    .select('*')
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data as BalanceSummary | null
}

export const updateBalanceSummary = async () => {
  const invoices = await getInvoices()
  const expenses = await getExpenses()
  
  const totalEarnings = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  const totalExpenses = expenses
    .reduce((sum, exp) => sum + exp.amount, 0)
  
  const currentBalance = totalEarnings - totalExpenses
  
  const existing = await getBalanceSummary()
  
  if (existing) {
    const { data, error } = await supabase
      .from('balance_summary')
      .update({
        total_earnings: totalEarnings,
        total_expenses: totalExpenses,
        current_balance: currentBalance,
        last_calculated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw error
    return data as BalanceSummary
  } else {
    const { data, error } = await supabase
      .from('balance_summary')
      .insert([{
        total_earnings: totalEarnings,
        total_expenses: totalExpenses,
        current_balance: currentBalance,
        balance_start_date: new Date().toISOString(),
        last_calculated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data as BalanceSummary
  }
}

// ============ ANALYTICS QUERIES ============

export const getMonthlyEarnings = async (year?: number) => {
  const invoices = await getInvoices()
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid')
  
  const monthlyData = new Map<string, number>()
  
  paidInvoices.forEach(invoice => {
    const date = new Date(invoice.date_issued)
    if (year && date.getFullYear() !== year) return
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const current = monthlyData.get(monthKey) || 0
    monthlyData.set(monthKey, current + invoice.amount)
  })
  
  return Array.from(monthlyData.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const getClientRevenue = async () => {
  const clients = await getClients()
  const invoices = await getInvoices()
  
  return clients.map(client => {
    const clientInvoices = invoices.filter(inv => inv.client_id === client.id)
    const paidInvoices = clientInvoices.filter(inv => inv.status === 'Paid')
    
    return {
      client_id: client.id,
      client_name: client.name,
      total_amount: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      invoice_count: clientInvoices.length
    }
  }).sort((a, b) => b.total_amount - a.total_amount)
}

export const getExpenseAnalytics = async () => {
  const expenses = await getExpenses()
  const categories = await getExpenseCategories()
  
  const categoryMap = new Map<string, { amount: number; count: number }>()
  
  expenses.forEach(expense => {
    const categoryName = expense.category_name || 'Uncategorized'
    const current = categoryMap.get(categoryName) || { amount: 0, count: 0 }
    categoryMap.set(categoryName, {
      amount: current.amount + expense.amount,
      count: current.count + 1
    })
  })
  
  const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, data]) => {
    const category = categories.find(c => c.name === name)
    return {
      name,
      amount: data.amount,
      count: data.count,
      color: category?.color || '#6B7280',
      icon: category?.icon || '💰'
    }
  }).sort((a, b) => b.amount - a.amount)
  
  return {
    total_expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    average_expense: expenses.length > 0 
      ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length 
      : 0,
    total_business_expenses: expenses
      .filter(exp => exp.is_business_expense)
      .reduce((sum, exp) => sum + exp.amount, 0),
    total_tax_deductible: expenses
      .filter(exp => exp.tax_deductible)
      .reduce((sum, exp) => sum + exp.amount, 0),
    expense_count: expenses.length,
    top_category: categoryBreakdown[0] || { name: 'No expenses', amount: 0 },
    category_breakdown: categoryBreakdown,
    monthly_data: [] // You can implement monthly expense data similar to earnings
  }
}