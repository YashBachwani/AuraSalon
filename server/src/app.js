import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { createHealthRouter } from './routes/health.js';
import { createBootstrapRouter } from './routes/bootstrap.js';
import { createQueueRouter, createBarberRouter } from './routes/queue.js';
import { createAuthRouter } from './routes/auth.js';
import { createAdminRouter } from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(db, ensureDbReady = null) {
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
        } catch { }
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
        });
      }
    });
  }

  app.use('/api/health', createHealthRouter(db));
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/admin', createAdminRouter(db));
  app.use('/api', createBootstrapRouter(db));
  app.use('/api/queue', createQueueRouter(db));
  app.use('/api/barbers', createBarberRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
