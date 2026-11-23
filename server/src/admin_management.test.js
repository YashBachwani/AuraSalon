import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDatabaseClient } from './db/client.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';
import { initSocketServer } from './socket/index.js';

test('Owner Service & Barber Management API & RBAC Suite', async (t) => {
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

  try {
    // 1. Obtain Tokens for all roles
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

    assert.ok(ownerToken, 'Owner token must exist');
    assert.ok(receptionToken, 'Reception token must exist');
    assert.ok(barberToken, 'Barber token must exist');
    assert.ok(customerToken, 'Customer token must exist');

    // ----------------------------------------------------
    // TEST 1: Strict RBAC Protection on Admin Endpoints
    // ----------------------------------------------------
    await t.test('RBAC: Anonymous and non-owner tokens are rejected', async () => {
      // Anonymous
      const noAuthRes = await fetch(`${serverUrl}/api/admin/services`);
      assert.equal(noAuthRes.status, 401, 'Anonymous request must return 401');

      // Customer
      const custRes = await fetch(`${serverUrl}/api/admin/services`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.equal(custRes.status, 403, 'Customer token must return 403 Forbidden');

      // Barber
      const barberRes = await fetch(`${serverUrl}/api/admin/barbers`, {
        headers: { Authorization: `Bearer ${barberToken}` },
      });
      assert.equal(barberRes.status, 403, 'Barber token must return 403 Forbidden');

      // Reception
      const recRes = await fetch(`${serverUrl}/api/admin/barbers`, {
        headers: { Authorization: `Bearer ${receptionToken}` },
      });
      assert.equal(recRes.status, 403, 'Reception token must return 403 Forbidden');
    });

    // ----------------------------------------------------
    // TEST 2: Services Management CRUD
    // ----------------------------------------------------
    let createdServiceId = null;

    await t.test('Services: Owner can list services with usage counts', async () => {
      const res = await fetch(`${serverUrl}/api/admin/services`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.ok);
      assert.ok(Array.isArray(data.services));
      assert.ok(data.services.length >= 4, 'Seeded services should be present');
      assert.ok('usageCount' in data.services[0], 'Each service must report usageCount');
    });

    await t.test('Services: Owner can create a new service with validation', async () => {
      // Invalid (name too short)
      const badRes = await fetch(`${serverUrl}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          nameEn: 'A',
          durationMinutes: 30,
          priceInr: 200,
        }),
      });
      assert.equal(badRes.status, 400);

      // Invalid duration (<= 0)
      const badDurRes = await fetch(`${serverUrl}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          nameEn: 'Valid Name',
          durationMinutes: 0,
          priceInr: 200,
        }),
      });
      assert.equal(badDurRes.status, 400);

      // Valid creation
      const validRes = await fetch(`${serverUrl}/api/admin/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          nameEn: 'Royal Beard Spa',
          nameGu: 'રોયલ દાઢી સ્પા',
          descriptionEn: 'Deep conditioning hot oil treatment',
          descriptionGu: 'ડીપ કન્ડીશનીંગ હોટ ઓઇલ સારવાર',
          durationMinutes: 45,
          priceInr: 650,
          isActive: true,
        }),
      });
      assert.equal(validRes.status, 201);
      const data = await validRes.json();
      assert.ok(data.ok);
      assert.ok(data.service.id);
      assert.equal(data.service.nameEn, 'Royal Beard Spa');
      assert.equal(data.service.priceInr, 650);
      assert.equal(data.service.durationMinutes, 45);
      createdServiceId = data.service.id;
    });

    await t.test('Services: Owner can update service details', async () => {
      const updateRes = await fetch(`${serverUrl}/api/admin/services/${createdServiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          nameEn: 'Royal Beard Spa (Ultra)',
          priceInr: 750,
          durationMinutes: 50,
          isActive: true,
        }),
      });
      assert.equal(updateRes.status, 200);
      const data = await updateRes.json();
      assert.ok(data.ok);
      assert.equal(data.service.nameEn, 'Royal Beard Spa (Ultra)');
      assert.equal(data.service.priceInr, 750);
      assert.equal(data.service.durationMinutes, 50);
    });

    await t.test('Services: Unreferenced service is hard deleted', async () => {
      const delRes = await fetch(`${serverUrl}/api/admin/services/${createdServiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(delRes.status, 200);
      const data = await delRes.json();
      assert.ok(data.ok);
      assert.equal(data.deleted, true);

      // Verify no longer in database
      const checkRes = await fetch(`${serverUrl}/api/admin/services`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const checkData = await checkRes.json();
      assert.ok(!checkData.services.some((s) => s.id === createdServiceId));
    });

    await t.test('Services: Referenced service is soft-deactivated', async () => {
      // 1. Join queue with service 1
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Test Reference Cust',
          phone: '9988776655',
          serviceIds: [1],
        }),
      });
      assert.equal(joinRes.status, 201);
      const testEntryId = (await joinRes.json()).entry.id;

      // 2. Attempt to delete service 1
      const delRes = await fetch(`${serverUrl}/api/admin/services/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(delRes.status, 200);
      const data = await delRes.json();
      assert.ok(data.ok);
      assert.equal(data.deactivated, true, 'Referenced service must be marked deactivated');

      // 3. Verify service 1 still exists in DB as inactive
      const checkRes = await fetch(`${serverUrl}/api/admin/services`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const checkData = await checkRes.json();
      const s1 = checkData.services.find((s) => s.id === 1);
      assert.ok(s1);
      assert.equal(s1.isActive, false);

      // Reactivate service 1 so other tests are unaffected
      await fetch(`${serverUrl}/api/admin/services/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ isActive: true }),
      });

      // Clean up test entry so queue is clear
      await fetch(`${serverUrl}/api/queue/${testEntryId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ reason: 'Test clean' }),
      });
    });

    // ----------------------------------------------------
    // TEST 3: Barbers Management CRUD
    // ----------------------------------------------------
    let createdBarberId = null;

    await t.test('Barbers: Owner can list barbers with operational status', async () => {
      const res = await fetch(`${serverUrl}/api/admin/barbers`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.ok);
      assert.ok(Array.isArray(data.barbers));
      assert.ok(data.barbers.length >= 2);
      assert.ok(data.barbers.some((b) => b.slug === 'isha'), 'Lead stylist Isha must be present');
    });

    await t.test('Barbers: Owner can create new barber with unique slug', async () => {
      // Duplicate slug check (attempt to create duplicate 'isha')
      const dupRes = await fetch(`${serverUrl}/api/admin/barbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          name: 'Isha Duplicate',
          slug: 'isha',
        }),
      });
      assert.equal(dupRes.status, 409, 'Duplicate slug must return 409 Conflict');

      // Valid creation
      const validRes = await fetch(`${serverUrl}/api/admin/barbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          name: 'Vikram Joshi',
          slug: 'vikram',
          specialty: 'Beard Architect',
          phone: '9876501234',
          avatarColor: '#10B981',
          pin: '9999',
          isOnDuty: true,
        }),
      });
      assert.equal(validRes.status, 201);
      const data = await validRes.json();
      assert.ok(data.ok);
      assert.ok(data.barber.id);
      assert.equal(data.barber.name, 'Vikram Joshi');
      assert.equal(data.barber.slug, 'vikram');
      assert.equal(data.barber.specialty, 'Beard Architect');
      createdBarberId = data.barber.id;
    });

    await t.test('Barbers: Custom PIN authentication works for new barber', async () => {
      const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: createdBarberId,
          pin: '9999',
        }),
      });
      assert.equal(loginRes.status, 200);
      const loginData = await loginRes.json();
      assert.ok(loginData.token);
      assert.equal(loginData.user.name, 'Vikram Joshi');
    });

    await t.test('Barbers: Barber with active customer cannot be deleted (409)', async () => {
      // 1. Join customer assigned specifically to Vikram
      const joinRes = await fetch(`${serverUrl}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Active In Chair Cust',
          phone: '9876599999',
          serviceIds: [2],
          preferredBarberId: createdBarberId,
        }),
      });
      const joinData = await joinRes.json();
      assert.equal(joinRes.status, 201);
      const entry = joinData.entry;

      // 2. Call customer to chair
      const callRes = await fetch(`${serverUrl}/api/queue/call-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ barberId: createdBarberId }),
      });
      assert.equal(callRes.status, 200);

      // 3. Attempt to delete barber while customer is active (CALLED)
      const delRes = await fetch(`${serverUrl}/api/admin/barbers/${createdBarberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(delRes.status, 409, 'Must reject deletion when active customer is called/in chair');
      const errData = await delRes.json();
      assert.equal(errData.error, 'BARBER_HAS_ACTIVE_CUSTOMER');

      // 4. Complete customer service
      const startRes = await fetch(`${serverUrl}/api/queue/${entry.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ barberId: createdBarberId }),
      });
      assert.equal(startRes.status, 200);

      const completeRes = await fetch(`${serverUrl}/api/queue/${entry.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${receptionToken}`,
        },
        body: JSON.stringify({ barberId: createdBarberId }),
      });
      assert.equal(completeRes.status, 200);
    });

    await t.test('Barbers: Barber with historical records is soft-deactivated', async () => {
      // Vikram now has 1 completed customer in history
      const delRes = await fetch(`${serverUrl}/api/admin/barbers/${createdBarberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert.equal(delRes.status, 200);
      const data = await delRes.json();
      assert.ok(data.ok);
      assert.equal(data.deactivated, true, 'Barber with history must be soft-deactivated');

      // Check barber status is off duty & off duty availability
      const checkRes = await fetch(`${serverUrl}/api/admin/barbers`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const checkData = await checkRes.json();
      const b = checkData.barbers.find((x) => x.id === createdBarberId);
      assert.ok(b);
      assert.equal(b.isOnDuty, false);
      assert.equal(b.availability, 'OFF_DUTY');
    });

    await t.test('Barbers: Deactivated barber cannot log in', async () => {
      const loginRes = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'barber',
          barberId: createdBarberId,
          pin: '9999',
        }),
      });
      assert.equal(loginRes.status, 403, 'Deactivated barber must be rejected from login');
    });
  } finally {
    ioServer.close();
    httpServer.close();
  }
});
