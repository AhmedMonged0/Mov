import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Categories from './pages/Categories';
import SearchResults from './pages/SearchResults';
import Series from './pages/Series';
import SeriesDetails from './pages/SeriesDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { AdminAuthProvider, AdminProtectedRoute } from './context/AdminAuthContext';
import { trackPageView } from './services/analyticsTracker';
import { initAdShield } from './services/adShield';

// Initialize AdShield (blocks offensive third-party popups & secures admin area)
if (typeof window !== 'undefined') {
  initAdShield();
}

// Automatic global telemetry listener: logs page views across routes
function AnalyticsListener() {
  const location = useLocation();

  useEffect(() => {
    // Only track public user routes, exclude admin panel routes from public visitor stats
    if (!location.pathname.startsWith('/admin')) {
      trackPageView(location.pathname);
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AnalyticsListener />
        <Analytics />
        <Routes>
          {/* Public Platform Routes */}
          <Route path="/" element={<ErrorBoundary><MainLayout /></ErrorBoundary>}>
            <Route index element={<Home />} />
            <Route path="movie/:id" element={<MovieDetails />} />
            <Route path="series" element={<Series />} />
            <Route path="series/:id" element={<SeriesDetails />} />
            <Route path="tv/:id" element={<SeriesDetails />} />
            <Route path="categories" element={<Categories />} />
            <Route path="search" element={<SearchResults />} />
          </Route>

          {/* Private Admin Dashboard Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
