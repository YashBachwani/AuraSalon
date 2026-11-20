import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { io as ioClient } from 'socket.io-client';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

test('Queue Integration Test Suite — TC-01 to TC-14', async (t) => {
  const db = createDatabaseClient(':memory:');
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  const ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  const serverUrl = `http://127.0.0.1:${port}`;

  const socket = ioClient(serverUrl, {
    transports: ['websocket'],
    reconnection: true,
  });

  await new Promise((resolve) => socket.on('connect', resolve));

  try {
    // -------------------------------------------------------------
    // TC-01: Successful customer joining
    // -------------------------------------------------------------
    await t.test('TC-01: Successful customer joining', async () => {
      const res = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Aarav Patel',
          phone: '9876543210',
          serviceIds: [1, 2], // Haircut (150, 30m) + Beard Trim (80, 15m)
          preferredBarberId: null, // Any Barber
        }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.entry.customerName, 'Aarav Patel');
      assert.equal(data.entry.phone, '9876543210');
      assert.equal(data.entry.tokenNumber, 'S-01');
      assert.equal(data.entry.totalDurationMinutes, 45);
      assert.equal(data.entry.totalPriceInr, 230);
      assert.equal(data.entry.status, 'WAITING');
      assert.equal(data.entry.services.length, 2);

      // Verify database record directly
      const dbCheck = await db.execute({
        sql: 'SELECT * FROM queue_entries WHERE id = ?',
        args: [data.entry.id],
      });
      assert.equal(dbCheck.rows.length, 1);
      assert.equal(dbCheck.rows[0].token_number, 'S-01');
    });

    // -------------------------------------------------------------
    // TC-02: Reception visibility
    // -------------------------------------------------------------
    await t.test('TC-02: Reception visibility', async () => {
      const res = await fetch(`${serverUrl}/api/queue`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      const found = data.entries.find((e) => e.customerName === 'Aarav Patel');
      assert.ok(found, 'Newly created customer must appear in Reception queue');
      assert.equal(found.tokenNumber, 'S-01');
      assert.equal(found.status, 'WAITING');
    });

    // -------------------------------------------------------------
    // TC-03: Customer status
    // -------------------------------------------------------------
    await t.test('TC-03: Customer status', async () => {
      const res = await fetch(`${serverUrl}/api/queue/S-01`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.entry.tokenNumber, 'S-01');
      assert.equal(data.entry.customerName, 'Aarav Patel');
      assert.equal(data.entry.status, 'WAITING');
      assert.equal(data.entry.services.length, 2);
    });

    // -------------------------------------------------------------
    // TC-04: Barber queue & Specific Barber Preference
    // -------------------------------------------------------------
    await t.test('TC-04: Barber queue', async () => {
      // Fetch barbers to get Isha and Amit's IDs
      const barbersRes = await db.execute('SELECT id, name, slug FROM barbers');
      const isha = barbersRes.rows.find((b) => b.slug === 'isha');
      const amit = barbersRes.rows.find((b) => b.slug === 'amit');

      // Join customer specifically for Isha
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Kunal Shah',
          phone: '9876543211',
          serviceIds: [1],
          preferredBarberId: isha.id,
        }),
      });
      assert.equal(joinRes.status, 201);
      const joinData = await joinRes.json();
      assert.equal(joinData.entry.tokenNumber, 'S-02');

      // Isha's queue must contain Kunal Shah (S-02)
      const ishaQueueRes = await fetch(`${serverUrl}/api/queue/barber/isha`);
      const ishaQueue = await ishaQueueRes.json();
      assert.ok(
        ishaQueue.upcomingQueue.some((e) => e.tokenNumber === 'S-02'),
        "Isha's queue must contain Kunal Shah"
      );

      // Amit's queue must NOT contain Kunal Shah (S-02), but may contain Any Barber (S-01)
      const amitQueueRes = await fetch(`${serverUrl}/api/queue/barber/amit`);
      const amitQueue = await amitQueueRes.json();
      assert.equal(
        amitQueue.upcomingQueue.some((e) => e.tokenNumber === 'S-02'),
        false,
        "Amit's queue must NOT contain a customer who specifically selected Isha"
      );
    });

    // -------------------------------------------------------------
    // TC-05: Any Barber assignment & FCFS
    // -------------------------------------------------------------
    await t.test('TC-05: Any Barber assignment', async () => {
      // S-01 selected Any Barber. Call next on Amit (id = 2)
      const barbersRes = await db.execute({
        sql: 'SELECT id, slug FROM barbers WHERE slug = ?',
        args: ['amit'],
      });
      const amitId = barbersRes.rows[0].id;

      const callRes = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
        },
        body: JSON.stringify({ barberId: amitId }),
      });

      assert.equal(callRes.status, 200);
      const callData = await callRes.json();
      // Amit should have received S-01 (Any Barber) because S-01 was earlier FCFS
      assert.equal(callData.entry.tokenNumber, 'S-01');
      assert.equal(callData.entry.status, 'CALLED');
      assert.equal(callData.entry.assignedBarber.id, amitId);

      // Verify Amit's availability is now BUSY
      const amitCheck = await db.execute({
        sql: 'SELECT availability FROM barbers WHERE id = ?',
        args: [amitId],
      });
      assert.equal(amitCheck.rows[0].availability, 'BUSY');
    });

    // -------------------------------------------------------------
    // TC-06: Specific barber unavailable (ON_BREAK / OFF_DUTY)
    // -------------------------------------------------------------
    await t.test('TC-06: Specific barber unavailable', async () => {
      // Put Imran on break
      const imranRes = await db.execute({
        sql: 'SELECT id FROM barbers WHERE slug = ?',
        args: ['imran'],
      });
      const imranId = imranRes.rows[0].id;

      await fetch(`${serverUrl}/api/barbers/${imranId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: 'ON_BREAK' }),
      });

      // Try joining specifically for Imran
      const res = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Test Unavailable',
          phone: '9876543212',
          serviceIds: [1],
          preferredBarberId: imranId,
        }),
      });

      assert.equal(res.status, 409);
      const err = await res.json();
      assert.equal(err.error, 'BARBER_ON_BREAK');

      // Restore Imran to AVAILABLE
      await fetch(`${serverUrl}/api/barbers/${imranId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: 'AVAILABLE' }),
      });
    });

    // -------------------------------------------------------------
    // TC-07: Duplicate phone number prevention
    // -------------------------------------------------------------
    await t.test('TC-07: Duplicate phone number prevention', async () => {
      // Customer S-02 has phone '9876543211' (WAITING)
      const res = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Kunal Again',
          phone: '9876543211',
          serviceIds: [1],
        }),
      });

      assert.equal(res.status, 409);
      const err = await res.json();
      assert.equal(err.error, 'DUPLICATE_ACTIVE_PHONE');
      assert.equal(err.details.existingEntry.tokenNumber, 'S-02');
    });

    // -------------------------------------------------------------
    // TC-08: Maximum services limit
    // -------------------------------------------------------------
    await t.test('TC-08: Maximum services limit', async () => {
      const res = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Over Limit',
          phone: '9876543213',
          serviceIds: [1, 2, 3, 4], // 4 services (max 3 allowed)
        }),
      });

      assert.equal(res.status, 400);
      const err = await res.json();
      assert.equal(err.error, 'INVALID_SERVICES_COUNT');
    });

    // -------------------------------------------------------------
    // TC-09: Socket.IO notification on join
    // -------------------------------------------------------------
    await t.test('TC-09: Socket notification', async () => {
      let receivedEvent = null;
      const eventPromise = new Promise((resolve) => {
        socket.once('queue:created', (payload) => {
          receivedEvent = payload;
          resolve(payload);
        });
      });

      const res = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Socket Test Customer',
          phone: '9876543214',
          serviceIds: [1],
        }),
      });

      assert.equal(res.status, 201);
      const event = await eventPromise;
      assert.ok(event);
      assert.equal(event.entry.customerName, 'Socket Test Customer');
    });

    // -------------------------------------------------------------
    // TC-10: Persistence across server restarts
    // -------------------------------------------------------------
    await t.test('TC-10: Database persistence', async () => {
      const tempDbPath = path.join(process.cwd(), 'server', 'data', 'test_persist.db');
      if (fs.existsSync(tempDbPath)) {
        try { fs.unlinkSync(tempDbPath); } catch {}
      }

      // Create file-based db instance
      const fileDb1 = createDatabaseClient(`file:${tempDbPath}`);
      await initializeSchema(fileDb1);
      await seedDatabase(fileDb1);

      // Insert queue entry
      const app1 = createApp(fileDb1);
      const srv1 = http.createServer(app1);
      await new Promise((resolve) => srv1.listen(0, '127.0.0.1', resolve));
      const srv1Url = `http://127.0.0.1:${srv1.address().port}`;

      const joinRes = await fetch(`${srv1Url}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Persisted Customer',
          phone: '9876543215',
          serviceIds: [1],
        }),
      });
      assert.equal(joinRes.status, 201);
      const joinData = await joinRes.json();
      await new Promise((resolve) => srv1.close(resolve));
      if (fileDb1.close) fileDb1.close();

      // Re-open with new database client connection to the same file
      const fileDb2 = createDatabaseClient(`file:${tempDbPath}`);
      const checkRes = await fileDb2.execute({
        sql: 'SELECT * FROM queue_entries WHERE phone = ?',
        args: ['9876543215'],
      });
      assert.equal(checkRes.rows.length, 1);
      assert.equal(checkRes.rows[0].token_number, joinData.entry.tokenNumber);
      if (fileDb2.close) fileDb2.close();

      // Clean up temp test db
      try {
        if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
      } catch {}
    });

    // -------------------------------------------------------------
    // TC-11: Concurrent registrations
    // -------------------------------------------------------------
    await t.test('TC-11: Concurrent registrations', async () => {
      const promises = [1, 2, 3, 4, 5].map((i) =>
        fetch(`${serverUrl}/api/queue/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: `Concurrent Customer ${i}`,
            phone: `987654322${i}`,
            serviceIds: [1],
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      assert.equal(results.length, 5);

      const tokens = results.map((r) => r.entry.tokenNumber);
      const uniqueTokens = new Set(tokens);
      assert.equal(uniqueTokens.size, 5, 'All concurrent registrations must receive unique tokens');

      // Verify all 5 tokens are stored in the database
      const countRes = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM queue_entries WHERE customer_name LIKE ?',
        args: ['Concurrent Customer %'],
      });
      assert.equal(Number(countRes.rows[0].count), 5);
    });

    // -------------------------------------------------------------
    // TC-12: Online closing cutoff vs Reception Walk-in
    // -------------------------------------------------------------
    await t.test('TC-12: Online closing cutoff vs Walk-in', async () => {
      // Manually set online join closed in salon_settings
      await db.execute('UPDATE salon_settings SET is_online_join_manually_closed = 1 WHERE id = 1');

      // Online join must be rejected with 403
      const onlineRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Late Online Joiner',
          phone: '9876543230',
          serviceIds: [1],
        }),
      });
      assert.equal(onlineRes.status, 403);
      const onlineErr = await onlineRes.json();
      assert.equal(onlineErr.error, 'ONLINE_JOIN_CLOSED');

      // Walk-in at Reception MUST SUCCEED (201) even when online join is closed!
      const walkinRes = await fetch(`${serverUrl}/api/queue/walkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-pin': '1234',
        },
        body: JSON.stringify({
          customerName: 'Reception Walkin Customer',
          phone: '9876543231',
          serviceIds: [1],
        }),
      });
      assert.equal(walkinRes.status, 201);
      const walkinData = await walkinRes.json();
      assert.equal(walkinData.entry.source, 'WALK_IN');

      // Restore setting
      await db.execute('UPDATE salon_settings SET is_online_join_manually_closed = 0 WHERE id = 1');
    });

    // -------------------------------------------------------------
    // TC-13: Duplicate action and retry safety
    // -------------------------------------------------------------
    await t.test('TC-13: Duplicate action and retry safety', async () => {
      // Repeat submission for '9876543231' (registered in TC-12)
      const retryRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Reception Walkin Customer',
          phone: '9876543231',
          serviceIds: [1],
        }),
      });
      assert.equal(retryRes.status, 409);
      const retryData = await retryRes.json();
      assert.equal(retryData.error, 'DUPLICATE_ACTIVE_PHONE');
    });

    // -------------------------------------------------------------
    // TC-14: Client reconnection authoritative state refresh
    // -------------------------------------------------------------
    await t.test('TC-14: Client reconnection authoritative refresh', async () => {
      // Disconnect socket
      socket.disconnect();

      // Create a customer while socket is disconnected
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Offline Created Customer',
          phone: '9876543240',
          serviceIds: [1],
        }),
      });
      assert.equal(joinRes.status, 201);
      const joinData = await joinRes.json();

      // Reconnect socket
      socket.connect();
      await new Promise((resolve) => socket.on('connect', resolve));

      // Fetch authoritative REST state
      const stateRes = await fetch(`${serverUrl}/api/queue`);
      assert.equal(stateRes.status, 200);
      const state = await stateRes.json();
      assert.ok(
        state.entries.some((e) => e.tokenNumber === joinData.entry.tokenNumber),
        'After reconnection, client fetches complete authoritative state including offline created entry'
      );
    });
  } finally {
    socket.close();
    await new Promise((resolve) => httpServer.close(resolve));
  }
});
