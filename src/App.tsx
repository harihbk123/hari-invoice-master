import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Auth Components
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout Components
import Layout from './components/layout/Layout';

// Page Components
import EnhancedDashboard from './pages/EnhancedDashboard';
import InvoiceList from './pages/invoices/InvoiceList';
import CreateEditInvoice from './pages/invoices/CreateEditInvoice';
import ClientList from './pages/clients/ClientList';
import CreateEditClient from './pages/clients/CreateEditClient';
import ExpenseList from './pages/expenses/ExpenseList';
import CreateEditExpense from './pages/expenses/CreateEditExpense';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Styles
import './styles/globals.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    checkAuth();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (event === 'SIGNED_OUT') {
        // Clear any local storage
        localStorage.clear();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
              } 
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<EnhancedDashboard />} />
              <Route path="dashboard" element={<EnhancedDashboard />} />

              {/* Invoices */}
              <Route path="invoices">
                <Route index element={<InvoiceList />} />
                <Route path="new" element={<CreateEditInvoice />} />
                <Route path=":id/edit" element={<CreateEditInvoice />} />
              </Route>

              {/* Clients */}
              <Route path="clients">
                <Route index element={<ClientList />} />
                <Route path="new" element={<CreateEditClient />} />
                <Route path=":id/edit" element={<CreateEditClient />} />
              </Route>

              {/* Expenses */}
              <Route path="expenses">
                <Route index element={<ExpenseList />} />
                <Route path="new" element={<CreateEditExpense />} />
                <Route path=":id/edit" element={<CreateEditExpense />} />
              </Route>

              {/* Analytics */}
              <Route path="analytics" element={<AnalyticsPage />} />

              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;