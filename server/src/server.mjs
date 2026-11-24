/**
 * Local Development HTTP Server with Socket.IO Real-Time Engine
 * Run directly via: node src/server.mjs
 */
import http from 'node:http';
import app, { ensureDatabaseReady } from './app.js';
import { env } from './config/env.js';
import { initSocketServer } from './socket/index.js';

export async function startServer() {
  await ensureDatabaseReady();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  return new Promise((resolve, reject) => {
    httpServer.listen(env.port, () => {
      console.log(`[Aura Salon Server] Running on http://localhost:${env.port}`);
      console.log(`[Aura Salon Server] Allowed origin: ${env.clientOrigin}`);
      resolve(httpServer);
    }).on('error', reject);
  });
}

startServer().catch((err) => {
  console.error('[Aura Salon Server] Failed to start:', err);
  process.exit(1);
});
