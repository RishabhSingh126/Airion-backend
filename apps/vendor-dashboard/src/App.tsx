import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, ProtectedRoute } from '@ease2event/shared';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

// Static imports for instant page transitions
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import Inbox from './pages/Inbox';
import VendorLogin from './pages/VendorLogin';
import VendorSignupBasic from './pages/auth/VendorSignupBasic';
import VendorSignupForm from './pages/VendorSignup';
import Bookings from './pages/Bookings';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import EventPlanning from './pages/EventPlanning';
import Promotions from './pages/Promotions';
import Calendar from './pages/Calendar';
import Earnings from './pages/Earnings';
import PackageInquiries from './pages/PackageInquiries';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Gallery from './pages/Gallery';
import ShopItems from './pages/ShopItems';
import MerchandiseOrders from './pages/MerchandiseOrders';
import PremiumUpgrade from './pages/PremiumUpgrade';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" toastOptions={{ duration: 6000, style: { background: '#ffffff', color: '#1a1a2e', border: '1px solid #f0effe' } }} />
        <Router basename={import.meta.env.PROD ? '/vendor' : '/'}>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="login" element={<VendorLogin />} />
                <Route path="signup" element={<VendorSignupBasic />} />
                <Route path="signup-form" element={<VendorSignupForm />} />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute allowedRoles={['vendor', 'admin']}>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="events" element={<Listings />} />
                  <Route path="enquiries" element={<Inbox />} />
                  <Route path="package-inquiries" element={<PackageInquiries />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="shop-items" element={<ShopItems />} />
                  <Route path="shop/orders" element={<MerchandiseOrders />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Navigate to="/settings?tab=profile" replace />} />

                   <Route path="calendar" element={<Calendar />} />
                  <Route path="earnings" element={<Earnings />} />
                  <Route path="services" element={<Services />} />
                  <Route path="products" element={<Navigate to="/services" replace />} />
                  <Route path="reviews" element={<Reviews />} />
                  <Route path="ads" element={<Promotions />} />
                  <Route path="promotions" element={<Promotions />} />
                  <Route path="plan-event" element={<EventPlanning />} />
                  <Route path="gallery" element={<Gallery />} />
                  <Route path="premium" element={<PremiumUpgrade />} />
                </Route>

                {/* Catch-all - redirect within the basename context */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
