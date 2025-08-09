// src/components/expenses/ExpenseFilters.tsx

import React, { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import type { ExpenseCategory, ExpenseFilters, PaymentMethod } from '../../models/Expense';
import { PAYMENT_METHODS } from '../../models/Expense';

interface ExpenseFiltersComponentProps {
  categories: ExpenseCategory[];
  onFiltersChange: (filters: ExpenseFilters) => void;
  currentFilters: ExpenseFilters;
}

const ExpenseFiltersComponent: React.FC<ExpenseFiltersComponentProps> = ({
  categories,
  onFiltersChange,
  currentFilters
}) => {
  const [filters, setFilters] = useState<ExpenseFilters>(currentFilters);

  const handleFilterChange = (key: keyof ExpenseFilters, value: any) => {
    const newFilters = { ...filters };
    
    if (value === '' || value === 'all' || value === false) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = value;
    }
    
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(filters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).filter(key => key !== 'searchTerm').length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category-filter"
            value={filters.category || 'all'}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Filter */}
        <div>
          <label htmlFor="payment-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            id="payment-filter"
            value={filters.paymentMethod || 'all'}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          >
            <option value="all">All Methods</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>
                {method.icon} {method.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="date-from"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="date-to"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Business Only Checkbox */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.businessOnly || false}
            onChange={(e) => handleFilterChange('businessOnly', e.target.checked)}
            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Business expenses only</span>
        </label>
      </div>

      {/* Filter Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {hasActiveFilters && (
            <span className="flex items-center gap-2">
              <Filter size={16} />
              {Object.keys(filters).filter(key => key !== 'searchTerm').length} active filter(s)
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Clear
            </button>
          )}
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseFiltersComponent;