import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer, getSocketServer } from './socket/index.js';
import { signToken } from './services/authService.js';

describe('Final QA Stabilisation & Boundary Test Suite', () => {
  let db;
  let server;
  let baseUrl;
  let ishaToken;
  let amitToken;
  let receptionToken;
  let ownerToken;

  before(async () => {
    process.env.DATABASE_URL = ':memory:';
    db = createDatabaseClient(':memory:');
    await initializeSchema(db);
    await seedDatabase(db);

    const app = createApp(db);
    server = http.createServer(app);
    initSocketServer(server);

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Create signed test tokens
    ishaToken = signToken({ role: 'barber', barberId: 1, slug: 'isha', name: 'Isha' });
    amitToken = signToken({ role: 'barber', barberId: 2, slug: 'amit', name: 'Amit' });
    receptionToken = signToken({ role: 'reception', name: 'Receptionist' });
    ownerToken = signToken({ role: 'owner', name: 'Salon Owner' });
  });

  beforeEach(async () => {
    await db.execute('DELETE FROM queue_entries');
    await db.execute("UPDATE barbers SET availability = 'AVAILABLE'");
  });

  after(async () => {
    getSocketServer()?.close();
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  it('1. Rejects invalid customer phone number (not 10 digits)', async () => {
    const res = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Dev Test',
        phone: '12345',
        serviceIds: [1],
      }),
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error, 'INVALID_PHONE');
  });

  it('2. Rejects customer with more than 3 services', async () => {
    const res = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Multi Service',
        phone: '9876543211',
        serviceIds: [1, 2, 3, 4],
      }),
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error, 'INVALID_SERVICES_COUNT');
  });

  it('3. Rejects booking a barber who is currently ON_BREAK', async () => {
    // Put Amit on break
    await db.execute("UPDATE barbers SET availability = 'ON_BREAK' WHERE id = 2");

    const res = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Break Test',
        phone: '9876543212',
        serviceIds: [1],
        preferredBarberId: 2,
      }),
    });
    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.error, 'BARBER_ON_BREAK');

    // Restore Amit
    await db.execute("UPDATE barbers SET availability = 'AVAILABLE' WHERE id = 2");
  });

  it('4. Concurrency safety: 5 simultaneous joins with the same phone only produce 1 active ticket', async () => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      fetch(`${baseUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: `Racer ${i}`,
          phone: '9871112233',
          serviceIds: [1],
          preferredBarberId: 1,
        }),
      })
    );

    const responses = await Promise.all(promises);
    const statuses = responses.map((r) => r.status);
    const successes = statuses.filter((s) => s === 201);
    const duplicates = statuses.filter((s) => s === 409);

    assert.equal(successes.length, 1, 'Exactly one join should succeed');
    assert.equal(duplicates.length, 4, 'Four simultaneous duplicate joins should receive HTTP 409');
  });

  it('5. Enforces strict 10-minute NO_SHOW rule boundary (fails before 10 min, succeeds after)', async () => {
    // Join queue for Isha
    const joinRes = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'NoShow Tester',
        phone: '9872223344',
        serviceIds: [1],
        preferredBarberId: 1,
      }),
    });
    assert.equal(joinRes.status, 201);
    const { entry } = await joinRes.json();

    // Call customer
    const callRes = await fetch(`${baseUrl}/api/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    assert.equal(callRes.status, 200);

    // Attempt to mark No-Show immediately (0 minutes elapsed) -> MUST FAIL (409)
    const earlyNoShow = await fetch(`${baseUrl}/api/queue/${entry.id}/no-show`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    assert.equal(earlyNoShow.status, 409);
    const earlyJson = await earlyNoShow.json();
    assert.equal(earlyJson.error, 'NO_SHOW_GRACE_ACTIVE');

    // Simulate 11 minutes elapsed
    const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    await db.execute({
      sql: 'UPDATE queue_entries SET called_at = ? WHERE id = ?',
      args: [elevenMinutesAgo, entry.id],
    });

    // Attempt No-Show after 11 minutes -> MUST SUCCEED (200)
    const validNoShow = await fetch(`${baseUrl}/api/queue/${entry.id}/no-show`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    assert.equal(validNoShow.status, 200);
    const validJson = await validNoShow.json();
    assert.equal(validJson.entry.status, 'NO_SHOW');

    // Barber Isha is now restored to AVAILABLE
    const ishaRes = await db.execute('SELECT availability FROM barbers WHERE id = 1');
    assert.equal(ishaRes.rows[0].availability, 'AVAILABLE');
  });

  it('6. Rejects illegal state transition: Cannot complete an entry in WAITING state', async () => {
    const joinRes = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Illegal State Test',
        phone: '9873334455',
        serviceIds: [1],
      }),
    });
    const { entry } = await joinRes.json();

    const completeRes = await fetch(`${baseUrl}/api/queue/${entry.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    assert.equal(completeRes.status, 409);
    const json = await completeRes.json();
    assert.equal(json.error, 'INVALID_STATE_TRANSITION');
  });

  it('7. Barber chair isolation: Barber Amit cannot complete service assigned to Barber Isha', async () => {
    // Join for Isha and call for Isha
    const joinRes = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Chair Isolation Test',
        phone: '9874445566',
        serviceIds: [1],
        preferredBarberId: 1,
      }),
    });
    const { entry } = await joinRes.json();

    await fetch(`${baseUrl}/api/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });

    // Start service by Isha
    await fetch(`${baseUrl}/api/queue/${entry.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ishaToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });

    // Amit tries to complete Isha's customer -> MUST RETURN 403 FORBIDDEN
    const amitComplete = await fetch(`${baseUrl}/api/queue/${entry.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({ barberId: 2 }),
    });
    assert.equal(amitComplete.status, 403);
    const amitJson = await amitComplete.json();
    assert.equal(amitJson.error, 'FORBIDDEN_BARBER_ACCESS');

    // Isha completes her own customer -> MUST SUCCEED (200)
    const ishaComplete = await fetch(`${baseUrl}/api/queue/${entry.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ishaToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    assert.equal(ishaComplete.status, 200);
  });

  it('8. Customer ticket privacy: Customer A cannot view Customer B ticket at /api/queue/:id', async () => {
    // Customer A joins
    const joinA = await fetch(`${baseUrl}/api/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Customer A',
        phone: '9875556677',
        serviceIds: [1],
      }),
    });
    const { entry: entryA } = await joinA.json();

    // Customer B logs in
    const tokenB = signToken({ role: 'customer', phone: '9876667788', name: 'Customer B' });

    // Customer B attempts to fetch Customer A's ticket
    const res = await fetch(`${baseUrl}/api/queue/${entryA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error, 'UNAUTHORIZED_TICKET_ACCESS');
  });
});
