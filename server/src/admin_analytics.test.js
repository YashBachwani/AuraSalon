import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

test('Owner Analytics API & Real-Time Sync Test Suite', async (t) => {
  const db = createDatabaseClient(':memory:');
  await initializeSchema(db);
  await seedDatabase(db);

  const app = createApp(db);
  const httpServer = http.createServer(app);
  const ioServer = initSocketServer(httpServer);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address();
  const serverUrl = `http://127.0.0.1:${port}`;

  let ownerToken = '';
  let receptionToken = '';
  let barberToken = '';
  let customerToken = '';

  let entry1Id = null;
  let entry2Id = null;

  try {
    // Setup Tokens for all roles
    const [ownerRes, recRes, bRes, custRes] = await Promise.all([
      fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'owner', pin: '5678' }),
      }),
      fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reception', pin: '1234' }),
      }),
      fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'barber', barberId: 1, pin: '1234' }),
      }),
      fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer', phone: '9876543210', code: '123456' }),
      }),
    ]);

    ownerToken = (await ownerRes.json()).token;
    receptionToken = (await recRes.json()).token;
    barberToken = (await bRes.json()).token;
    customerToken = (await custRes.json()).token;

    // -------------------------------------------------------------
    // 1. Owner can fetch analytics after authentication
    // -------------------------------------------------------------
    await t.test('1. Owner can fetch analytics after authentication (HTTP 200)', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
      assert.ok(data.analytics.todayOverview);
      assert.ok(data.analytics.revenueOverview);
      assert.ok(data.analytics.barberPerformance);
      assert.ok(data.analytics.serviceAnalytics);
    });

    // -------------------------------------------------------------
    // 2. Customer cannot access analytics (HTTP 403)
    // -------------------------------------------------------------
    await t.test('2. Customer cannot access analytics (returns HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------
    // 3. Barber cannot access analytics (HTTP 403)
    // -------------------------------------------------------------
    await t.test('3. Barber cannot access analytics (returns HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${barberToken}` },
      });
      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------
    // 4. Reception cannot access analytics (HTTP 403)
    // -------------------------------------------------------------
    await t.test('4. Reception cannot access analytics (returns HTTP 403 Forbidden)', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${receptionToken}` },
      });
      assert.equal(res.status, 403);
    });

    // -------------------------------------------------------------
    // 5 & 6. New customer registration increases today's registrations and waiting count
    // -------------------------------------------------------------
    await t.test('5 & 6. New customer registration increases today registrations and waiting count', async () => {
      // Snapshot before
      const preRes = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const preData = await preRes.json();
      const initialTotal = preData.analytics.todayOverview.totalCustomersToday;
      const initialWaiting = preData.analytics.todayOverview.waitingCount;

      // Join customer 1 (Haircut = 150 INR, duration = 30m, preferred Isha)
      const join1 = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Customer One',
          phone: '9811111111',
          serviceIds: [1], // Haircut (150 INR)
          preferredBarberId: 1,
        }),
      });
      assert.equal(join1.status, 201);
      const join1Data = await join1.json();
      entry1Id = join1Data.entry.id;

      // Join customer 2 (Beard Trim = 80 INR, duration = 15m, preferred Isha)
      const join2 = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Customer Two',
          phone: '9822222222',
          serviceIds: [2], // Beard Trim (80 INR)
          preferredBarberId: 1,
        }),
      });
      assert.equal(join2.status, 201);
      const join2Data = await join2.json();
      entry2Id = join2Data.entry.id;

      // Verify analytics updated
      const postRes = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const postData = await postRes.json();
      assert.equal(postData.analytics.todayOverview.totalCustomersToday, initialTotal + 2);
      assert.equal(postData.analytics.todayOverview.waitingCount, initialWaiting + 2);
    });

    // -------------------------------------------------------------
    // 7. Starting service updates the serving count (IN_CHAIR)
    // -------------------------------------------------------------
    await t.test('7. Calling customer and starting service updates serving count', async () => {
      // 1. Reception calls next for Isha (customer 1)
      const callRes = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ barberId: 1 }),
      });
      assert.equal(callRes.status, 200);

      // 2. Barber starts service
      const startRes = await fetch(`${serverUrl}/api/queue/${entry1Id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${barberToken}` },
      });
      assert.equal(startRes.status, 200);

      // Verify serving count is now 1 and waiting count decreased by 1
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      assert.equal(data.analytics.todayOverview.servingCount, 1);
      assert.equal(data.analytics.todayOverview.waitingCount, 1);
    });

    // -------------------------------------------------------------
    // 8 & 9. Completing service updates completed count and revenue
    // -------------------------------------------------------------
    await t.test('8 & 9. Completing service updates completed count and revenue', async () => {
      const preRes = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const preData = await preRes.json();
      const preCompleted = preData.analytics.todayOverview.completedCount;
      const preRevenue = preData.analytics.revenueOverview.todayRevenue;

      // Complete customer 1 service (Haircut = 150 INR)
      const doneRes = await fetch(`${serverUrl}/api/queue/${entry1Id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${barberToken}` },
      });
      assert.equal(doneRes.status, 200);

      // Verify analytics
      const postRes = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const postData = await postRes.json();
      assert.equal(postData.analytics.todayOverview.completedCount, preCompleted + 1);
      assert.equal(postData.analytics.todayOverview.servingCount, 0);
      assert.equal(postData.analytics.revenueOverview.todayRevenue, preRevenue + 150);
      assert.equal(postData.analytics.revenueOverview.totalCompletedRevenue, preRevenue + 150);
    });

    // -------------------------------------------------------------
    // 10. Cancellation updates the cancellation count
    // -------------------------------------------------------------
    await t.test('10. Cancellation updates the cancellation count', async () => {
      // Cancel customer 2 (which is still WAITING)
      const cancelRes = await fetch(`${serverUrl}/api/queue/${entry2Id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ reason: 'Customer changed plans' }),
      });
      assert.equal(cancelRes.status, 200);

      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      assert.equal(data.analytics.todayOverview.cancelledCount, 1);
      assert.equal(data.analytics.todayOverview.waitingCount, 0);
    });

    // -------------------------------------------------------------
    // 11. Service popularity reflects actual selections
    // -------------------------------------------------------------
    await t.test('11. Service popularity reflects actual selections', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      const services = data.analytics.serviceAnalytics.services;

      const haircut = services.find((s) => s.id === 1);
      const beardTrim = services.find((s) => s.id === 2);

      assert.ok(haircut);
      assert.ok(beardTrim);
      assert.equal(haircut.selectedCount, 1);
      assert.equal(beardTrim.selectedCount, 1);
      assert.equal(haircut.completedRevenueInr, 150); // Completed
      assert.equal(beardTrim.completedRevenueInr, 0); // Cancelled, so revenue is 0
    });

    // -------------------------------------------------------------
    // 12. Barber performance reflects actual assigned entries
    // -------------------------------------------------------------
    await t.test('12. Barber performance reflects actual activity', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      const isha = data.analytics.barberPerformance.find((b) => b.slug === 'isha');

      assert.ok(isha);
      assert.equal(isha.customersCompletedToday, 1);
      assert.equal(isha.revenueTodayInr, 150);
      assert.equal(isha.customersCurrentlyServing, 0);
      assert.equal(isha.availability, 'AVAILABLE');
    });

    // -------------------------------------------------------------
    // 13. Date filters return valid results
    // -------------------------------------------------------------
    await t.test('13. Date filters return correct results', async () => {
      const res7d = await fetch(`${serverUrl}/api/admin/analytics?range=7d`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data7d = await res7d.json();
      assert.equal(data7d.ok, true);
      assert.equal(data7d.analytics.selectedRange, '7d');

      const res30d = await fetch(`${serverUrl}/api/admin/analytics?range=30d`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data30d = await res30d.json();
      assert.equal(data30d.ok, true);
      assert.equal(data30d.analytics.selectedRange, '30d');
    });

    // -------------------------------------------------------------
    // 14. Unauthenticated request rejected with 401
    // -------------------------------------------------------------
    await t.test('14. Unauthenticated request rejected with 401 Unauthorized', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`);
      assert.equal(res.status, 401);
    });

    // -------------------------------------------------------------
    // 15. Recent activity log includes completed and cancelled items
    // -------------------------------------------------------------
    await t.test('15. Recent activity log records recent queue events', async () => {
      const res = await fetch(`${serverUrl}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const data = await res.json();
      const recent = data.analytics.recentActivity;
      assert.ok(recent.length >= 2);
      assert.ok(recent.some((r) => r.id === entry1Id && r.status === 'DONE'));
      assert.ok(recent.some((r) => r.id === entry2Id && r.status === 'CANCELLED'));
    });
  } finally {
    await new Promise((resolve) => ioServer.close(resolve));
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    db.close();
  }
});

