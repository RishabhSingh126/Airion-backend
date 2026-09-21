import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, ProtectedRoute } from '@ease2event/shared';

const queryClient = new QueryClient();

// Static imports for instant page transitions
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Vendors from './pages/Vendors';
import Settings from './pages/Settings';
import Bookings from './pages/Bookings';
import Categories from './pages/Categories';
import Subscriptions from './pages/Subscriptions';
import Advertisements from './pages/Advertisements';
import Coupons from './pages/Coupons';
import SupportTickets from './pages/SupportTickets';
import Reports from './pages/Reports';
import AdminLogin from './pages/AdminLogin';
import ShopAdmin from './pages/Shop';
import ShopOrders from './pages/ShopOrders';
import Refunds from './pages/Refunds';
import CMS from './pages/CMS';
import Packages from './pages/Packages';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
    <div className=" rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" toastOptions={{ duration: 6000, style: { background: '#ffffff', color: '#1a1a2e', border: '1px solid #f0effe' } }} />
        <Router basename={import.meta.env.PROD ? '/admin' : '/'}>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route path="/" element={
                  <ProtectedRoute 
                    allowedRoles={['admin']} 
                  >
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="users" element={<Users />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="advertisements" element={<Advertisements />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="support" element={<SupportTickets />} />
                  <Route path="shop" element={<ShopAdmin />} />
                  <Route path="shop-orders" element={<ShopOrders />} />
                  <Route path="refunds" element={<Refunds />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="cms" element={<CMS />} />
                  <Route path="packages" element={<Packages />} />
                  <Route path="*" element={<div className="p-8 text-[var(--ease2event-text-primary)] font-medium">Page not found</div>} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
