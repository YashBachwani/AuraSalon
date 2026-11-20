import http from 'node:http';
import { env } from './config/env.js';
import { db } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

async function startServer() {
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[Aura Salon Server] Running on http://localhost:${env.port}`);
    console.log(`[Aura Salon Server] Allowed origin: ${env.clientOrigin}`);
  });
}

startServer().catch((err) => {
  console.error('[Aura Salon Server] Failed to start:', err);
  process.exit(1);
});
