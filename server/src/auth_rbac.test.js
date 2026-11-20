import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

test('Stage 3 — Role-Based Auth & RBAC Test Suite (Cases 1 to 20)', async (t) => {
  const db = createDatabaseClient(':memory:');
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  const ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  const serverUrl = `http://127.0.0.1:${port}`;

  let customerToken = '';
  let raviToken = '';
  let amitToken = '';
  let imranToken = '';
  let receptionToken = '';
  let ownerToken = '';
  let createdEntryId = null;

  try {
    // -------------------------------------------------------------
    // 1. Customer login succeeds with valid demo credentials
    // -------------------------------------------------------------
    await t.test('TC-01: Customer login succeeds with valid demo credentials', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          phone: '9876543210',
          code: '123456',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'customer');
      assert.equal(data.user.phone, '9876543210');
      assert.ok(data.token);
      customerToken = data.token;
    });

    // -------------------------------------------------------------
    // 2. Customer login fails with invalid verification code
    // -------------------------------------------------------------
    await t.test('TC-02: Customer login fails with invalid verification code', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'customer',
          phone: '9876543210',
          code: '999999',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'INVALID_VERIFICATION_CODE');
    });

    // -------------------------------------------------------------
    // 3. Barber login succeeds for Ravi with valid PIN (1234)
    // -------------------------------------------------------------
    await t.test('TC-03: Barber login succeeds for Ravi with valid PIN (1234)', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: 1,
          pin: '1234',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'barber');
      assert.equal(data.user.name, 'Ravi');
      assert.equal(data.user.slug, 'ravi');
      assert.ok(data.token);
      raviToken = data.token;
    });

    // -------------------------------------------------------------
    // 4. Barber login succeeds for Amit with valid PIN (1234)
    // -------------------------------------------------------------
    await t.test('TC-04: Barber login succeeds for Amit with valid PIN (1234)', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: 2,
          pin: '1234',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'barber');
      assert.equal(data.user.name, 'Amit');
      assert.equal(data.user.slug, 'amit');
      assert.ok(data.token);
      amitToken = data.token;
    });

    // -------------------------------------------------------------
    // 5. Barber login succeeds for Imran with valid PIN (1234)
    // -------------------------------------------------------------
    await t.test('TC-05: Barber login succeeds for Imran with valid PIN (1234)', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: 3,
          pin: '1234',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'barber');
      assert.equal(data.user.name, 'Imran');
      assert.equal(data.user.slug, 'imran');
      assert.ok(data.token);
      imranToken = data.token;
    });

    // -------------------------------------------------------------
    // 6. Barber login fails with invalid PIN
    // -------------------------------------------------------------
    await t.test('TC-06: Barber login fails with invalid PIN', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: 1,
          pin: '0000',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'INVALID_PIN');
    });

    // -------------------------------------------------------------
    // 7. Reception login succeeds with valid staff PIN (1234)
    // -------------------------------------------------------------
    await t.test('TC-07: Reception login succeeds with valid staff PIN (1234)', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'reception',
          pin: '1234',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'reception');
      assert.ok(data.token);
      receptionToken = data.token;
    });

    // -------------------------------------------------------------
    // 8. Reception login fails with invalid PIN
    // -------------------------------------------------------------
    await t.test('TC-08: Reception login fails with invalid PIN', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'reception',
          pin: '9999',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'INVALID_PIN');
    });

    // -------------------------------------------------------------
    // 9. Owner login succeeds with valid owner PIN (5678)
    // -------------------------------------------------------------
    await t.test('TC-09: Owner login succeeds with valid owner PIN (5678)', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'owner',
          pin: '5678',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.equal(data.user.role, 'owner');
      assert.ok(data.token);
      ownerToken = data.token;
    });

    // -------------------------------------------------------------
    // 10. Owner login fails with invalid PIN
    // -------------------------------------------------------------
    await t.test('TC-10: Owner login fails with invalid PIN', async () => {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'owner',
          pin: '0000',
        }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'INVALID_PIN');
    });

    // -------------------------------------------------------------
    // 11. Customer token cannot access Reception dashboard (403)
    // -------------------------------------------------------------
    await t.test('TC-11: Customer token cannot access Reception dashboard (returns 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/queue`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'FORBIDDEN');
    });

    // -------------------------------------------------------------
    // 12. Customer token cannot execute staff call-next action (403)
    // -------------------------------------------------------------
    await t.test('TC-12: Customer token cannot call-next (returns 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barberId: 1 }),
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      assert.equal(data.ok, false);
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'FORBIDDEN');
    });

    // -------------------------------------------------------------
    // 13. Customer token cannot access another customer's ticket details (403)
    // -------------------------------------------------------------
    await t.test("TC-13: Customer token cannot access another customer's ticket details (returns 403)", async () => {
      // Create ticket for customer A (phone 9123456789, preferred Amit)
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Other Person',
          phone: '9123456789',
          serviceIds: [1],
          preferredBarberId: 2, // Preferred Amit
        }),
      });
      const joinData = await joinRes.json();
      assert.equal(joinRes.status, 201);
      const otherTicketId = joinData.entry.id;

      // Customer with phone 9876543210 tries to fetch customer A's ticket
      const ticketRes = await fetch(`${serverUrl}/api/queue/${otherTicketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.equal(ticketRes.status, 403);
      const ticketData = await ticketRes.json();
      const errCode = ticketData.error?.code || ticketData.error;
      assert.equal(errCode, 'UNAUTHORIZED_TICKET_ACCESS');
    });

    // -------------------------------------------------------------
    // 14. Barber token cannot access full reception queue table (403)
    // -------------------------------------------------------------
    await t.test('TC-14: Barber token cannot access full reception queue table (returns 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/queue`, {
        headers: { Authorization: `Bearer ${raviToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'FORBIDDEN');
    });

    // -------------------------------------------------------------
    // 15. Barber token for Ravi cannot perform actions or access workspace for Amit (403)
    // -------------------------------------------------------------
    await t.test('TC-15: Barber token for Ravi cannot access workspace for Amit (returns 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/queue/barber/amit`, {
        headers: { Authorization: `Bearer ${raviToken}` },
      });

      assert.equal(res.status, 403);
      const data = await res.json();
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'FORBIDDEN_BARBER_ACCESS');
    });

    // -------------------------------------------------------------
    // 16. Unauthenticated requests to protected endpoints return 401 Unauthorized
    // -------------------------------------------------------------
    await t.test('TC-16: Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
      const res = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId: 1 }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      const errCode = data.error?.code || data.error;
      assert.equal(errCode, 'UNAUTHORIZED');
    });

    // -------------------------------------------------------------
    // 17. Logging out revokes session / token verification
    // -------------------------------------------------------------
    await t.test('TC-17: Logging out revokes session / token verification', async () => {
      // First verify me endpoint works
      const meBefore = await fetch(`${serverUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(meBefore.status, 200);

      // Logout
      const logoutRes = await fetch(`${serverUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(logoutRes.status, 200);

      // Verify old token is now rejected
      const meAfter = await fetch(`${serverUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(meAfter.status, 401);

      // Re-login customer for remaining tests (gets brand-new unique token)
      const reLogin = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer', phone: '9876543210', code: '123456' }),
      });
      assert.equal(reLogin.status, 200);
      const reData = await reLogin.json();
      customerToken = reData.token;
    });

    // -------------------------------------------------------------
    // 18. Customer dashboard returns active ticket and past history correctly
    // -------------------------------------------------------------
    await t.test('TC-18: Customer dashboard returns active ticket correctly', async () => {
      // Join customer 9876543210 into queue
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Aarav Patel',
          phone: '9876543210',
          serviceIds: [1, 2],
          preferredBarberId: 1, // preferred Ravi
        }),
      });
      assert.equal(joinRes.status, 201);
      const joinData = await joinRes.json();
      createdEntryId = joinData.entry.id;

      // Fetch customer dashboard
      const dashRes = await fetch(`${serverUrl}/api/auth/customer/dashboard`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(dashRes.status, 200);
      const dashData = await dashRes.json();
      assert.equal(dashData.ok, true);
      assert.ok(dashData.activeEntry);
      assert.equal(dashData.activeEntry.id, createdEntryId);
      assert.equal(dashData.activeEntry.tokenNumber, joinData.entry.tokenNumber);
    });

    // -------------------------------------------------------------
    // 19. Demo credentials catalog endpoint returns valid list of barbers and credentials
    // -------------------------------------------------------------
    await t.test('TC-19: Demo credentials catalog endpoint returns valid list of barbers and credentials', async () => {
      const res = await fetch(`${serverUrl}/api/auth/demo-credentials`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.catalog.customer);
      assert.ok(data.catalog.reception);
      assert.ok(data.catalog.owner);
      assert.ok(Array.isArray(data.catalog.barbers));
      assert.equal(data.catalog.barbers.length, 3);
      assert.equal(data.catalog.barbers[0].name, 'Ravi');
      assert.equal(data.catalog.barbers[1].name, 'Amit');
      assert.equal(data.catalog.barbers[2].name, 'Imran');
    });

    // -------------------------------------------------------------
    // 20. Queue operations work seamlessly with authenticated roles
    // -------------------------------------------------------------
    await t.test('TC-20: Queue operations work seamlessly with authenticated roles (Reception -> Barber -> Complete)', async () => {
      // 1. Reception calls next for Ravi
      const callRes = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${receptionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barberId: 1 }),
      });
      assert.equal(callRes.status, 200);
      const callData = await callRes.json();
      assert.equal(callData.entry.id, createdEntryId);
      assert.equal(callData.entry.status, 'CALLED');
      assert.equal(callData.entry.assignedBarber.id, 1);

      // 2. Barber Ravi starts service
      const startRes = await fetch(`${serverUrl}/api/queue/${createdEntryId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${raviToken}` },
      });
      assert.equal(startRes.status, 200);
      const startData = await startRes.json();
      assert.equal(startData.entry.status, 'IN_CHAIR');

      // 3. Barber Ravi completes service
      const completeRes = await fetch(`${serverUrl}/api/queue/${createdEntryId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${raviToken}` },
      });
      assert.equal(completeRes.status, 200);
      const completeData = await completeRes.json();
      assert.equal(completeData.entry.status, 'DONE');

      // 4. Customer dashboard now reflects completed visit in history
      const dashRes = await fetch(`${serverUrl}/api/auth/customer/dashboard`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const dashData = await dashRes.json();
      assert.equal(dashData.activeEntry, null);
      assert.ok(dashData.history.length >= 1);
      assert.equal(dashData.history[0].id, createdEntryId);
      assert.equal(dashData.history[0].status, 'DONE');
    });
  } finally {
    await new Promise((resolve) => ioServer.close(resolve));
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    db.close();
  }
});
