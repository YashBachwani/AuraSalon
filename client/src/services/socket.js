import { io } from 'socket.io-client';
import { API_BASE_URL } from './api.js';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(API_BASE_URL, {
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
