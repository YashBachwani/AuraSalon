import app, { ensureDatabaseReady } from '../src/app.js';

/**
 * Explicit Serverless Function handler for Vercel
 */
export default async function handler(req, res) {
  await ensureDatabaseReady();
  return app(req, res);
}

export { app };
