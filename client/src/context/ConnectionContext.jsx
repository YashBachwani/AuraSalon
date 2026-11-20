import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [socketStatus, setSocketStatus] = useState('reconnecting');
  const [socketId, setSocketId] = useState(null);
  const [bootstrap, setBootstrap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const wasDisconnectedRef = useRef(false);

  const refreshBootstrap = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await api.getBootstrap();
      setBootstrap(data);
      setError(null);
      setLastSyncedAt(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Unable to connect to backend');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setSocketStatus('live');
      setSocketId(socket.id || null);
      if (wasDisconnectedRef.current) {
        wasDisconnectedRef.current = false;
        refreshBootstrap({ silent: true });
      }
    };

    const handleDisconnect = () => {
      wasDisconnectedRef.current = true;
      setSocketStatus('offline');
      setSocketId(null);
    };

    const handleReconnectAttempt = () => {
      wasDisconnectedRef.current = true;
      setSocketStatus('reconnecting');
    };

    const handleConnectError = () => {
      wasDisconnectedRef.current = true;
      setSocketStatus('offline');
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleConnect);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshBootstrap({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleConnect);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshBootstrap]);

  const value = useMemo(
    () => ({
      socketStatus,
      socketId,
      bootstrap,
      loading,
      error,
      lastSyncedAt,
      refreshBootstrap,
    }),
    [socketStatus, socketId, bootstrap, loading, error, lastSyncedAt, refreshBootstrap]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return ctx;
}
