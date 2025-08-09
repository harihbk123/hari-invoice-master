// src/components/expenses/BalanceCards.tsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import type { BalanceSummary, ExpenseAnalytics } from '../../models/Expense';
import { expenseService } from '../../services/expenseService';
import { formatCurrency } from '../../utils/formatters';

const BalanceCards: React.FC = () => {
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceData, analyticsData] = await Promise.all([
        expenseService.getBalanceSummary(),
        expenseService.getAnalytics()
      ]);
      setBalance(balanceData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading balance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!balance || !analytics) return null;

  const cards = [
    {
      title: 'Total Earnings',
      value: formatCurrency(balance.total_earnings),
      icon: <DollarSign className="text-green-500" size={24} />,
      bgColor: 'bg-green-50',
      iconBgColor: 'bg-green-100',
      trend: null
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(balance.total_expenses),
      icon: <TrendingDown className="text-red-500" size={24} />,
      bgColor: 'bg-red-50',
      iconBgColor: 'bg-red-100',
      subtitle: `${analytics.expenseCount} transactions`
    },
    {
      title: 'Current Balance',
      value: formatCurrency(balance.current_balance),
      icon: balance.current_balance >= 0 ? 
        <TrendingUp className="text-teal-500" size={24} /> : 
        <TrendingDown className="text-red-500" size={24} />,
      bgColor: balance.current_balance >= 0 ? 'bg-teal-50' : 'bg-red-50',
      iconBgColor: balance.current_balance >= 0 ? 'bg-teal-100' : 'bg-red-100',
      trend: balance.current_balance >= 0 ? 'Profit' : 'Loss',
      trendColor: balance.current_balance >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Top Category',
      value: analytics.topCategory.name,
      icon: <PieChart className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-50',
      iconBgColor: 'bg-purple-100',
      subtitle: formatCurrency(analytics.topCategory.amount)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </h3>
              {card.subtitle && (
                <p className="text-sm text-gray-600">{card.subtitle}</p>
              )}
              {card.trend && (
                <p className={`text-sm font-medium ${card.trendColor}`}>
                  {card.trend}
                </p>
              )}
            </div>
            <div className={`${card.iconBgColor} p-3 rounded-lg`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BalanceCards;