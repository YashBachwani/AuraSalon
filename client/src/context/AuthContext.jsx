import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { api, getStoredToken, setStoredToken } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { LoadingState } from '../components/ui/StateViews.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    const activeToken = getStoredToken();
    if (!activeToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser({ ...res.user, activeTicket: res.activeTicket || null });
        setToken(activeToken);
      } else {
        setStoredToken(null);
        setUser(null);
        setToken(null);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Keep customer active ticket in sync with real-time socket events
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    const socket = getSocket();
    const handleQueueChange = () => {
      fetchSession();
    };

    socket.on('queue:created', handleQueueChange);
    socket.on('queue:updated', handleQueueChange);
    socket.on('customer:called', handleQueueChange);
    socket.on('queue:started', handleQueueChange);
    socket.on('queue:completed', handleQueueChange);
    socket.on('queue:cancelled', handleQueueChange);
    socket.on('queue:no-show', handleQueueChange);

    return () => {
      socket.off('queue:created', handleQueueChange);
      socket.off('queue:updated', handleQueueChange);
      socket.off('customer:called', handleQueueChange);
      socket.off('queue:started', handleQueueChange);
      socket.off('queue:completed', handleQueueChange);
      socket.off('queue:cancelled', handleQueueChange);
      socket.off('queue:no-show', handleQueueChange);
    };
  }, [user?.role, user?.phone, fetchSession]);

  const login = useCallback(async (credentials) => {
    const res = await api.login(credentials);
    if (res?.token && res?.user) {
      setStoredToken(res.token);
      setToken(res.token);
      setUser({ ...res.user, activeTicket: res.activeTicket || null });
      return res.user;
    }
    throw new Error('Login failed: invalid response from server.');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // safe fallback on network error
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      activeTicket: user?.activeTicket || null,
      isAuthenticated: Boolean(user),
      loading,
      login,
      logout,
      refreshUser: fetchSession,
    }),
    [user, token, loading, login, logout, fetchSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/**
 * Route guard enforcing role-based access control
 */
export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191817] flex items-center justify-center p-4">
        <LoadingState message="Verifying session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permission
  if (allowedRoles.length > 0) {
    const userRole = user.role;
    const isAllowed =
      allowedRoles.includes(userRole) ||
      (userRole === 'owner' && allowedRoles.includes('reception'));

    if (!isAllowed) {
      // Redirect to their own role's home
      if (userRole === 'customer') return <Navigate to="/customer" replace />;
      if (userRole === 'barber') return <Navigate to={`/barber/${user.slug || 'ravi'}`} replace />;
      if (userRole === 'reception') return <Navigate to="/reception" replace />;
      if (userRole === 'owner') return <Navigate to="/admin" replace />;
      return <Navigate to="/" replace />;
    }
  }

  // Barber Isolation Guard: if logged in as a barber, can only access own /barber/:name
  if (user.role === 'barber' && params.name) {
    const requestedBarber = String(params.name).toLowerCase();
    const mySlug = String(user.slug || '').toLowerCase();
    const myName = String(user.name || '').toLowerCase();
    if (requestedBarber !== mySlug && requestedBarber !== myName) {
      return <Navigate to={`/barber/${mySlug}`} replace />;
    }
  }

  return children;
}

