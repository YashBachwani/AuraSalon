import { Server } from 'socket.io';
import { env } from '../config/env.js';

let ioInstance = null;

export function initSocketServer(httpServer) {
  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
    pingInterval: 20000,
    pingTimeout: 10000,
  });

  ioInstance.on('connection', (socket) => {
    socket.emit('server:connected', {
      socketId: socket.id,
      serverTime: new Date().toISOString(),
    });

    socket.on('client:ping', (ack) => {
      if (typeof ack === 'function') {
        ack({ ok: true, serverTime: new Date().toISOString() });
      }
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  return ioInstance;
}

export function getConnectedClientCount() {
  if (!ioInstance) return 0;
  return ioInstance.engine.clientsCount;
}

export function broadcastEvent(eventName, payload) {
  if (!ioInstance) return;
  ioInstance.emit(eventName, payload);
}
