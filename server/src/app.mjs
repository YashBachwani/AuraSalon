/**
 * Vercel Serverless Entrypoint (ES Module .mjs)
 * Exposes the initialized Express application as default export.
 */
import app, { createApp, ensureDatabaseReady } from './app.js';

export { createApp, ensureDatabaseReady, app };
export default app;
