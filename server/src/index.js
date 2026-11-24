/**
 * Server Root Entrypoint
 * Supports both standalone local execution (Express + Socket.IO) and Vercel serverless export.
 */
import http from 'node:http';
import url from 'node:url';
import app, { createApp, ensureDatabaseReady } from './app.js';
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

// Automatically start server only when executed directly (node src/index.js) and not in Vercel Serverless
const isDirectExecution =
  process.argv[1] &&
  import.meta.url === url.pathToFileURL(process.argv[1]).href;

if (isDirectExecution && !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Aura Salon Server] Failed to start:', err);
    process.exit(1);
  });
}

export { app, createApp, ensureDatabaseReady };
export default app;
