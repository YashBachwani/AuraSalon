import app, { ensureDatabaseReady } from '../src/index.js';

/**
 * Serverless Function handler for Vercel
 */
export default async function handler(req, res) {
  await ensureDatabaseReady();
  return app(req, res);
}

export { app };
