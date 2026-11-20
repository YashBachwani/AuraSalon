import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ConnectionProvider } from './context/ConnectionContext.jsx';
import { AuthProvider, ProtectedRoute } from './context/AuthContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage.jsx';
import { JoinQueuePage } from './pages/JoinQueuePage.jsx';
import { MyStatusPage } from './pages/MyStatusPage.jsx';
import { ReceptionPage } from './pages/ReceptionPage.jsx';
import { BarberPage } from './pages/BarberPage.jsx';
import { DisplayPage } from './pages/DisplayPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export function App() {
  return (
    <LanguageProvider>
      <ConnectionProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/join" element={<JoinQueuePage />} />
              <Route path="/status/:id" element={<MyStatusPage />} />
              <Route path="/display" element={<DisplayPage />} />

              {/* Customer Protected Route */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'reception', 'owner']}>
                    <CustomerDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Reception Protected Route */}
              <Route
                path="/reception"
                element={
                  <ProtectedRoute allowedRoles={['reception', 'owner']}>
                    <ReceptionPage />
                  </ProtectedRoute>
                }
              />

              {/* Barber Protected Route (with own-chair isolation) */}
              <Route
                path="/barber"
                element={
                  <ProtectedRoute allowedRoles={['barber', 'reception', 'owner']}>
                    <BarberPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/barber/:name"
                element={
                  <ProtectedRoute allowedRoles={['barber', 'reception', 'owner']}>
                    <BarberPage />
                  </ProtectedRoute>
                }
              />

              {/* Owner Protected Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConnectionProvider>
    </LanguageProvider>
  );
}

export default App;
