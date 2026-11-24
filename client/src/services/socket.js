import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    const targetUrl =
      import.meta.env.VITE_SOCKET_URL ||
      API_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    socketInstance = io(targetUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    });
  }

  return socketInstance;
}
