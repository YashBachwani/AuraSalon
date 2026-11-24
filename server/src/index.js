import http from 'node:http';
import url from 'node:url';
import { env } from './config/env.js';
import { db } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

let dbInitialized = false;
let dbInitPromise = null;

/**
 * Lazy/cached idempotent database initialization for serverless & local runtimes
 */
export async function ensureDatabaseReady() {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initializeSchema(db);
      await seedDatabase(db);
      dbInitialized = true;
    })().catch((err) => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

// Instantiate Express app with ensureDatabaseReady middleware
export const app = createApp(db, ensureDatabaseReady);

/**
 * Starts standalone HTTP and Socket.IO server for local development or container hosting
 */
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

// Automatically start server only when executed directly (node src/index.js) and not inside Vercel Serverless
const isDirectExecution =
  process.argv[1] &&
  import.meta.url === url.pathToFileURL(process.argv[1]).href;

if (isDirectExecution && !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('[Aura Salon Server] Failed to start:', err);
    process.exit(1);
  });
}

// Default export for Vercel Express framework handler
export default app;
