import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { db } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createHealthRouter } from './routes/health.js';
import { createBootstrapRouter } from './routes/bootstrap.js';
import { createQueueRouter, createBarberRouter } from './routes/queue.js';
import { createAuthRouter } from './routes/auth.js';
import { createAdminRouter } from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

let dbInitPromise = null;

/**
 * Lazy/cached idempotent database initialization for serverless and local execution
 */
export async function ensureDatabaseReady() {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initializeSchema(db);
      await seedDatabase(db);
    })().catch((err) => {
      dbInitPromise = null; // allow retry on next invocation if transient
      throw err;
    });
  }
  return dbInitPromise;
}

/**
 * Express application factory (used in automated tests and default application instance)
 */
export function createApp(databaseClient = db, ensureDbReady = null) {
  const app = express();

  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin / non-browser requests
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // In production on Vercel, allow *.vercel.app preview and production domains
        try {
          if (process.env.VERCEL && /\.vercel\.app$/.test(new URL(origin).hostname)) {
            return callback(null, true);
          }
        } catch {}
        // Fallback: allow to avoid blocking valid clients
        return callback(null, true);
      },
      credentials: false,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // In serverless environments, ensure DB schema and seeds are loaded before handling requests
  if (typeof ensureDbReady === 'function') {
    app.use(async (req, res, next) => {
      try {
        await ensureDbReady();
        next();
      } catch (err) {
        console.error('[Database Ready Middleware Error]:', err);
        res.status(503).json({
          ok: false,
          error: 'DATABASE_INITIALIZATION_FAILED',
          message: 'Unable to initialize database connection. Please check DATABASE_URL and credentials.',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      }
    });
  }

  app.use('/api/health', createHealthRouter(databaseClient));
  app.use('/api/auth', createAuthRouter(databaseClient));
  app.use('/api/admin', createAdminRouter(databaseClient));
  app.use('/api', createBootstrapRouter(databaseClient));
  app.use('/api/queue', createQueueRouter(databaseClient));
  app.use('/api/barbers', createBarberRouter(databaseClient));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Default application instance for Vercel serverless runtime
export const app = createApp(db, ensureDatabaseReady);

// Mandatory default export for Vercel Express runtime: must be an Express app function or server
export default app;
