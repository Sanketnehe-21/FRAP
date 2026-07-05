import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Components
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Families } from './pages/Families';
import { FamilyDetails } from './pages/FamilyDetails';
import { Users } from './pages/Users';
import { UserDetails } from './pages/UserDetails';
import { Transactions } from './pages/Transactions';
import { Goals } from './pages/Goals';
import { Documents } from './pages/Documents';
import { MerchantRegistry } from './pages/MerchantRegistry';
import { Feedback } from './pages/Feedback';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AdminManagement } from './pages/AdminManagement';
import { AuditLogs } from './pages/AuditLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Protected admin routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="families" element={<Families />} />
                <Route path="families/:familyId" element={<FamilyDetails />} />
                <Route path="users" element={<Users />} />
                <Route path="users/:userId" element={<UserDetails />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="goals" element={<Goals />} />
                <Route path="documents" element={<Documents />} />
                <Route path="merchant-registry" element={<MerchantRegistry />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                
                {/* Platform Admin Only routes */}
                <Route
                  path="admins"
                  element={
                    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
