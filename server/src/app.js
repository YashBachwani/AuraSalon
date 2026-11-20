import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { createHealthRouter } from './routes/health.js';
import { createBootstrapRouter } from './routes/bootstrap.js';
import { createQueueRouter, createBarberRouter } from './routes/queue.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(db) {
  const app = express();

  const allowedOrigins = env.clientOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: false,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', createHealthRouter(db));
  app.use('/api', createBootstrapRouter(db));
  app.use('/api/queue', createQueueRouter(db));
  app.use('/api/barbers', createBarberRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
