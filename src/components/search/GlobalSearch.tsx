import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon,
  ClockIcon 
} from '@heroicons/react/24/solid';
import { formatCurrency, formatDate } from '../../utils/format';

interface SearchResult {
  id: string;
  type: 'invoice' | 'client' | 'expense';
  title: string;
  subtitle?: string;
  meta?: string;
  url: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .or(`id.ilike.%${query}%,client_name.ilike.%${query}%`)
        .limit(5);

      if (invoices) {
        invoices.forEach(invoice => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: `Invoice #${invoice.id}`,
            subtitle: invoice.client_name,
            meta: formatCurrency(invoice.amount),
            url: `/invoices/${invoice.id}/edit`
          });
        });
      }

      // Search clients
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (clients) {
        clients.forEach(client => {
          searchResults.push({
            id: client.id,
            type: 'client',
            title: client.name,
            subtitle: client.email,
            meta: client.phone,
            url: `/clients/${client.id}/edit`
          });
        });
      }

      // Search expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .or(`description.ilike.%${query}%,vendor_name.ilike.%${query}%`)
        .limit(5);

      if (expenses) {
        expenses.forEach(expense => {
          searchResults.push({
            id: expense.id,
            type: 'expense',
            title: expense.description,
            subtitle: expense.vendor_name || expense.category_name,
            meta: formatCurrency(expense.amount),
            url: `/expenses/${expense.id}/edit`
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    // Navigate to result
    navigate(result.url);
    onClose();
    setQuery('');
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Search Modal */}
        <div className="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Search Header */}
          <div className="relative">
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search invoices, clients, expenses..."
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-2 px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500">No results found for "{query}"</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {result.type === 'invoice' && (
                        <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                      )}
                      {result.type === 'client' && (
                        <UserGroupIcon className="h-5 w-5 text-green-500" />
                      )}
                      {result.type === 'expense' && (
                        <CurrencyRupeeIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-sm text-gray-500">{result.subtitle}</p>
                      )}
                    </div>
                    {result.meta && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.meta}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length < 2 && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">Recent Searches</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {!loading && query.length < 2 && recentSearches.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">Start typing to search</p>
                <p className="text-xs text-gray-400 mt-2">
                  Search across invoices, clients, and expenses
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                  <span>to select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">ESC</kbd>
                  <span>to close</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-3 w-3 text-blue-500" />
                <span>Invoice</span>
                <UserGroupIcon className="h-3 w-3 text-green-500 ml-2" />
                <span>Client</span>
                <CurrencyRupeeIcon className="h-3 w-3 text-red-500 ml-2" />
                <span>Expense</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Search Hook for keyboard shortcut
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    openSearch: () => setIsOpen(true),
    closeSearch: () => setIsOpen(false)
  };
}