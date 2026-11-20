import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as ioClient } from 'socket.io-client';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

test('Stage 1 End-to-End: Express API + Socket.IO Real-time handshake + Reconnect handling', async () => {
  const db = createDatabaseClient(':memory:');
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  const ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  const serverUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check HTTP response
    const healthRes = await fetch(`${serverUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.database.engine, 'sqlite-libsql');
    assert.equal(health.database.connected, true);
    assert.equal(health.salon.nameEn, 'Aura Salon');
    assert.equal(health.salon.nameGu, 'ઓરા સલૂન');

    // 2. Bootstrap HTTP response
    const bootRes = await fetch(`${serverUrl}/api/bootstrap`);
    assert.equal(bootRes.status, 200);
    const boot = await bootRes.json();
    assert.equal(boot.counts.activeServices, 6);
    assert.equal(boot.counts.onDutyBarbers, 3);
    assert.deepEqual(
      boot.barbers.map((b) => b.slug),
      ['ravi', 'amit', 'imran']
    );

    // 3. Socket.IO connection & handshake
    const clientSocket = ioClient(serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
    });

    const connectPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket.IO connection timed out')), 5000);
      clientSocket.on('connect', () => {
        clearTimeout(timer);
        resolve(clientSocket.id);
      });
      clientSocket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const serverWelcomePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server:connected event timed out')), 5000);
      clientSocket.on('server:connected', (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const [socketId, welcomeData] = await Promise.all([connectPromise, serverWelcomePromise]);
    assert.ok(socketId, 'Client socket should have an assigned ID');
    assert.equal(welcomeData.socketId, socketId);
    assert.ok(welcomeData.serverTime);

    // 4. Ping-Ack over WebSocket
    const ack = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Ping ack timed out')), 3000);
      clientSocket.emit('client:ping', (response) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
    assert.equal(ack.ok, true);
    assert.ok(ack.serverTime);

    // 5. Clean disconnect
    clientSocket.disconnect();
    assert.equal(clientSocket.connected, false);
  } finally {
    await new Promise((resolve) => ioServer.close(resolve));
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    db.close();
  }
});
