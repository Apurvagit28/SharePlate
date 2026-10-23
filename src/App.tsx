import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import FindFoodPage from '@/pages/FindFoodPage';
import DonateFoodPage from '@/pages/DonateFoodPage';
import DashboardPage from '@/pages/DashboardPage';
import ListingDetailPage from '@/pages/ListingDetailPage';
import AuthPage from '@/pages/AuthPage';
import { AuthProvider } from '@/lib/auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/find-food" element={<FindFoodPage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/donate-food"
                element={
                  <ProtectedRoute>
                    <DonateFoodPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
