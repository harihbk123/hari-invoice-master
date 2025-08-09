// src/services/expenseService.ts

import { supabase } from '../lib/supabase';
import type { 
  Expense, 
  ExpenseCategory, 
  BalanceSummary, 
  ExpenseFilters,
  ExpenseAnalytics,
  DEFAULT_CATEGORIES
} from '../models/Expense';

class ExpenseService {
  // Fetch all expenses
  async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('date_incurred', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.category && filters.category !== 'all') {
          query = query.eq('category_id', filters.category);
        }
        if (filters.paymentMethod && filters.paymentMethod !== 'all') {
          query = query.eq('payment_method', filters.paymentMethod);
        }
        if (filters.dateFrom) {
          query = query.gte('date_incurred', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('date_incurred', filters.dateTo);
        }
        if (filters.businessOnly) {
          query = query.eq('is_business_expense', true);
        }
        if (filters.searchTerm) {
          query = query.or(`description.ilike.%${filters.searchTerm}%,vendor_name.ilike.%${filters.searchTerm}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  // Get single expense
  async getExpense(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  // Create new expense
  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    try {
      // Get category name if category_id is provided
      let categoryName = 'Uncategorized';
      if (expense.category_id) {
        const category = await this.getCategory(expense.category_id);
        if (category) {
          categoryName = category.name;
        }
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          ...expense,
          category_name: categoryName
        }])
        .select()
        .single();

      if (error) throw error;

      // Update balance summary
      await this.updateBalanceSummary();

      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      // Get category name if category_id is being updated
      if (updates.category_id) {
        const category = await this.getCategory(updates.category_id);
        if (category) {
          updates.category_name = category.name;
        }
      }

      const { data, error } = await supabase
        .from('expenses')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update balance summary
      await this.updateBalanceSummary();

      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update balance summary
      await this.updateBalanceSummary();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Get all categories
  async getCategories(): Promise<ExpenseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get single category
  async getCategory(id: string): Promise<ExpenseCategory | null> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  }

  // Create new category
  async createCategory(category: Omit<ExpenseCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ExpenseCategory> {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Initialize default categories
  async initializeDefaultCategories(): Promise<void> {
    try {
      const existingCategories = await this.getCategories();
      
      if (existingCategories.length === 0) {
        // Import DEFAULT_CATEGORIES properly
        const { DEFAULT_CATEGORIES } = await import('../models/Expense');
        
        const { error } = await supabase
          .from('expense_categories')
          .insert(DEFAULT_CATEGORIES);

        if (error) throw error;
        console.log('Default categories initialized');
      }
    } catch (error) {
      console.error('Error initializing default categories:', error);
    }
  }

  // Get balance summary
  async getBalanceSummary(): Promise<BalanceSummary> {
    try {
      const { data, error } = await supabase
        .from('balance_summary')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Initialize balance summary if it doesn't exist
        return await this.initializeBalanceSummary();
      }

      return data;
    } catch (error) {
      console.error('Error fetching balance summary:', error);
      throw error;
    }
  }

  // Initialize balance summary
  async initializeBalanceSummary(): Promise<BalanceSummary> {
    try {
      const { data, error } = await supabase
        .from('balance_summary')
        .insert([{
          total_earnings: 0,
          total_expenses: 0,
          current_balance: 0,
          balance_start_date: new Date().toISOString(),
          last_calculated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing balance summary:', error);
      throw error;
    }
  }

  // Update balance summary
  async updateBalanceSummary(): Promise<void> {
    try {
      // Get current balance summary
      const balanceSummary = await this.getBalanceSummary();

      // Calculate total expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount');

      if (expensesError) throw expensesError;

      const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

      // Get total earnings from invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount, status')
        .eq('status', 'Paid');

      if (invoicesError) throw invoicesError;

      const totalEarnings = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

      // Calculate current balance
      const currentBalance = totalEarnings - totalExpenses;

      // Update balance summary
      const { error: updateError } = await supabase
        .from('balance_summary')
        .update({
          total_earnings: totalEarnings,
          total_expenses: totalExpenses,
          current_balance: currentBalance,
          last_calculated_at: new Date().toISOString()
        })
        .eq('id', balanceSummary.id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating balance summary:', error);
    }
  }

  // Get expense analytics
  async getAnalytics(filters?: ExpenseFilters): Promise<ExpenseAnalytics> {
    try {
      const expenses = await this.getExpenses(filters);
      const categories = await this.getCategories();

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const expenseCount = expenses.length;
      const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

      // Calculate business and tax deductible expenses
      const businessExpenses = expenses.filter(exp => exp.is_business_expense);
      const totalBusinessExpenses = businessExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      const taxDeductibleExpenses = expenses.filter(exp => exp.tax_deductible);
      const totalTaxDeductible = taxDeductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Category breakdown
      const categoryMap = new Map<string, { amount: number; count: number; category: ExpenseCategory | null }>();
      
      expenses.forEach(expense => {
        const categoryName = expense.category_name || 'Uncategorized';
        const existing = categoryMap.get(categoryName) || { amount: 0, count: 0, category: null };
        
        if (!existing.category) {
          existing.category = categories.find(cat => cat.name === categoryName) || null;
        }
        
        existing.amount += expense.amount;
        existing.count += 1;
        categoryMap.set(categoryName, existing);
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          amount: data.amount,
          count: data.count,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          icon: data.category?.icon || '📎',
          color: data.category?.color || '#6B7280'
        }))
        .sort((a, b) => b.amount - a.amount);

      // Monthly data
      const monthlyMap = new Map<string, { amount: number; count: number }>();
      
      expenses.forEach(expense => {
        const date = new Date(expense.date_incurred);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyMap.get(monthKey) || { amount: 0, count: 0 };
        existing.amount += expense.amount;
        existing.count += 1;
        monthlyMap.set(monthKey, existing);
      });

      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          amount: data.amount,
          count: data.count
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Top category
      const topCategory = categoryBreakdown[0] || {
        name: 'No expenses',
        amount: 0,
        count: 0
      };

      return {
        totalExpenses,
        averageExpense,
        totalBusinessExpenses,
        totalTaxDeductible,
        expenseCount,
        topCategory,
        categoryBreakdown,
        monthlyData
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }

  // Export expenses to CSV
  exportToCSV(expenses: Expense[]): string {
    const headers = [
      'Date',
      'Description',
      'Category',
      'Amount',
      'Payment Method',
      'Vendor',
      'Receipt Number',
      'Business Expense',
      'Tax Deductible',
      'Notes'
    ];

    const rows = expenses.map(expense => [
      expense.date_incurred,
      `"${expense.description.replace(/"/g, '""')}"`,
      `"${expense.category_name.replace(/"/g, '""')}"`,
      expense.amount.toString(),
      expense.payment_method,
      expense.vendor_name ? `"${expense.vendor_name.replace(/"/g, '""')}"` : '',
      expense.receipt_number || '',
      expense.is_business_expense ? 'Yes' : 'No',
      expense.tax_deductible ? 'Yes' : 'No',
      expense.notes ? `"${expense.notes.replace(/"/g, '""')}"` : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}

export const expenseService = new ExpenseService();