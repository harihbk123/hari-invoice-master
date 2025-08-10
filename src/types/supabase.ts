export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      balance_summary: {
        Row: {
          id: string
          total_earnings: number | null
          total_expenses: number | null
          current_balance: number | null
          balance_start_date: string | null
          last_calculated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          total_earnings?: number | null
          total_expenses?: number | null
          current_balance?: number | null
          balance_start_date?: string | null
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          total_earnings?: number | null
          total_expenses?: number | null
          current_balance?: number | null
          balance_start_date?: string | null
          last_calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          payment_terms: string | null
          contact_name: string | null
          company: string | null
          total_invoices: number | null
          total_amount: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          contact_name?: string | null
          company?: string | null
          total_invoices?: number | null
          total_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          contact_name?: string | null
          company?: string | null
          total_invoices?: number | null
          total_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string
          category_id: string | null
          category_name: string | null
          date_incurred: string
          payment_method: string | null
          vendor_name: string | null
          receipt_number: string | null
          is_business_expense: boolean | null
          tax_deductible: boolean | null
          notes: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category_id?: string | null
          category_name?: string | null
          date_incurred?: string
          payment_method?: string | null
          vendor_name?: string | null
          receipt_number?: string | null
          is_business_expense?: boolean | null
          tax_deductible?: boolean | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          category_id?: string | null
          category_name?: string | null
          date_incurred?: string
          payment_method?: string | null
          vendor_name?: string | null
          receipt_number?: string | null
          is_business_expense?: boolean | null
          tax_deductible?: boolean | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          client_id: string | null
          client_name: string
          amount: number
          subtotal: number
          tax: number | null
          date_issued: string
          due_date: string
          status: string | null
          items: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          client_id?: string | null
          client_name: string
          amount: number
          subtotal: number
          tax?: number | null
          date_issued: string
          due_date: string
          status?: string | null
          items?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          client_name?: string
          amount?: number
          subtotal?: number
          tax?: number | null
          date_issued?: string
          due_date?: string
          status?: string | null
          items?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      settings: {
        Row: {
          user_id: string
          currency: string | null
          tax_rate: number | null
          invoice_prefix: string | null
          profile_name: string | null
          profile_email: string | null
          profile_phone: string | null
          profile_address: string | null
          profile_gstin: string | null
          bank_account_name: string | null
          bank_name: string | null
          bank_account: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_swift: string | null
          account_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          currency?: string | null
          tax_rate?: number | null
          invoice_prefix?: string | null
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
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          currency?: string | null
          tax_rate?: number | null
          invoice_prefix?: string | null
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
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
