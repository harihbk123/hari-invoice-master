// src/pages/CreateEditExpense.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Expense } from '../models/Expense';
import { expenseService } from '../services/expenseService';
import ExpenseForm from '../components/expenses/ExpenseForm';

const CreateEditExpense: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | undefined>(undefined);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      loadExpense(id);
    }
  }, [id]);

  const loadExpense = async (expenseId: string) => {
    try {
      const data = await expenseService.getExpense(expenseId);
      if (data) {
        setExpense(data);
      } else {
        navigate('/expenses');
      }
    } catch (error) {
      console.error('Error loading expense:', error);
      navigate('/expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    navigate('/expenses');
  };

  const handleCancel = () => {
    navigate('/expenses');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/expenses')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h1>
          <p className="text-gray-600 mt-1">
            {expense ? 'Update expense details' : 'Record a new business expense'}
          </p>
        </div>
      </div>

      {/* Form */}
      <ExpenseForm 
        expense={expense}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateEditExpense;