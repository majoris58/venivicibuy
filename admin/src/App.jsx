import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoriesPage from './pages/CategoriesPage';
import PlatformsPage from './pages/PlatformsPage';
import CampaignsPage from './pages/CampaignsPage';
import BannersPage from './pages/BannersPage';
import ProductStatsPage from './pages/ProductStatsPage';
import SheetSyncPage from './pages/SheetSyncPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="products/:id/stats" element={<ProductStatsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="platforms" element={<PlatformsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="sheet-sync" element={<SheetSyncPage />} />
      </Route>
    </Routes>
  );
}
