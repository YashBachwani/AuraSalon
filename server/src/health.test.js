import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

async function startTestServer() {
  const db = createDatabaseClient(':memory:');
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  const io = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    db,
    io,
    httpServer,
    async close() {
      await new Promise((resolve) => io.close(resolve));
      if (httpServer.listening) {
        await new Promise((resolve) => httpServer.close(resolve));
      }
      db.close();
    },
  };
}

test('Stage 1 backend health, bootstrap, seeding, and PIN verification', async () => {
  const srv = await startTestServer();
  try {
    // 1. Health check
    const healthRes = await fetch(`${srv.baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.database.engine, 'sqlite-libsql');
    assert.equal(health.database.connected, true);
    assert.equal(health.salon.nameEn, 'Aura Salon');
    assert.equal(health.salon.nameGu, 'ઓરા સલૂન');

    // 2. Bootstrap metadata & idempotent seed check
    await seedDatabase(srv.db);
    const bootRes = await fetch(`${srv.baseUrl}/api/bootstrap`);
    assert.equal(bootRes.status, 200);
    const boot = await bootRes.json();
    assert.equal(boot.counts.activeServices, 6);
    assert.equal(boot.counts.onDutyBarbers, 3);
    assert.deepEqual(
      boot.barbers.map((b) => b.name),
      ['Ravi', 'Amit', 'Imran']
    );

    // 3. PIN verification (valid & invalid)
    const badPinRes = await fetch(`${srv.baseUrl}/api/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '0000', role: 'staff' }),
    });
    assert.equal(badPinRes.status, 401);

    const staffPinRes = await fetch(`${srv.baseUrl}/api/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234', role: 'staff' }),
    });
    assert.equal(staffPinRes.status, 200);

    const ownerPinRes = await fetch(`${srv.baseUrl}/api/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '5678', role: 'owner' }),
    });
    assert.equal(ownerPinRes.status, 200);

    // 4. 404 handler check
    const notFoundRes = await fetch(`${srv.baseUrl}/api/non-existent`);
    assert.equal(notFoundRes.status, 404);
  } finally {
    await srv.close();
  }
});
