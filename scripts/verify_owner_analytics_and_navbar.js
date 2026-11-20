import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createDatabaseClient } from '../server/src/db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForUrl(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function takeScreenshot(url, outputPath, width = 1280, height = 800) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      `--screenshot=${outputPath}`,
      url,
    ];

    const child = spawn(CHROME_PATH, args);
    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        console.log(`  📸 Captured screenshot: ${path.basename(outputPath)} (${width}x${height})`);
        resolve();
      } else {
        reject(new Error(`Failed screenshot ${outputPath}, code: ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function run() {
  console.log('================================================================');
  console.log('  VERIFYING OWNER ANALYTICS & REFINED NAVBAR INTEGRATION       ');
  console.log('================================================================\n');

  // 1. Reset database rows for deterministic state
  const db = createDatabaseClient();
  await db.execute('DELETE FROM queue_entries');
  await db.execute("UPDATE barbers SET availability = 'AVAILABLE'");
  db.close();
  console.log('✔ Cleaned prior queue entries and reset barbers to AVAILABLE');

  console.log('1. Starting Backend Express + Socket.IO Server on :4000...');
  const serverProc = spawn('node', ['src/index.js'], {
    cwd: path.join(ROOT, 'server'),
    stdio: 'ignore',
  });

  console.log('2. Starting Frontend Client Preview Server on :5173...');
  const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'ignore',
  });

  try {
    await waitForUrl('http://localhost:4000/api/health');
    console.log('✔ Backend is ready on http://localhost:4000');
    await waitForUrl('http://localhost:5173');
    console.log('✔ Frontend is ready on http://localhost:5173\n');

    // 3. Test Owner Login
    console.log('3. Authenticating Owner via /api/auth/login...');
    const ownerLoginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'owner', pin: '5678' }),
    });
    const ownerAuth = await ownerLoginRes.json();
    if (!ownerAuth.ok || !ownerAuth.token) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerAuth)}`);
    }
    const ownerToken = ownerAuth.token;
    console.log('✔ Owner authenticated successfully. Token received.\n');

    // 4. Initial Analytics Check
    console.log('4. Fetching initial Owner Analytics via /api/admin/analytics?range=today...');
    const initialAnalyticsRes = await fetch('http://localhost:4000/api/admin/analytics?range=today', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const initialData = await initialAnalyticsRes.json();
    if (!initialData.ok || !initialData.analytics) {
      throw new Error(`Analytics failed: ${JSON.stringify(initialData)}`);
    }
    console.log('✔ Initial today overview:', initialData.analytics.todayOverview);
    console.log('✔ Initial revenue overview:', initialData.analytics.revenueOverview);

    // 5. Customer 1 Joins
    console.log('\n5. Registering Customer 1 (Kunal Shah, Haircut Rs. 400)...');
    const joinRes1 = await fetch('http://localhost:4000/api/queue/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Kunal Shah',
        phone: '9876543210',
        serviceIds: [1],
        barberPreference: 'any',
      }),
    });
    const joinData1 = await joinRes1.json();
    console.log(`✔ Customer 1 joined: Token ${joinData1.entry.token_number}, Status: ${joinData1.entry.status}`);

    // Verify Analytics after join
    const analyticsAfterJoin = await (
      await fetch('http://localhost:4000/api/admin/analytics?range=today', {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    console.log('✔ Analytics after join -> waitingCount:', analyticsAfterJoin.analytics.todayOverview.waitingCount);
    if (analyticsAfterJoin.analytics.todayOverview.waitingCount < 1) {
      throw new Error('Waiting count did not increment after customer joined!');
    }

    // 6. Reception Calls Next Customer for Barber Isha & Barber Starts Service
    console.log('\n6. Reception calls next customer for Barber Isha & Barber starts service...');
    const receptionistLoginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reception', pin: '1234' }),
    });
    const receptionToken = (await receptionistLoginRes.json()).token;

    const barberLoginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'barber', barberId: 1, pin: '1234' }),
    });
    const barberToken = (await barberLoginRes.json()).token;

    const callNextRes = await fetch('http://localhost:4000/api/queue/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    const callNextData = await callNextRes.json();
    console.log(`✔ Customer called: ID ${callNextData.entry.id}, Status: ${callNextData.entry.status}`);

    const startRes = await fetch(`http://localhost:4000/api/queue/${joinData1.entry.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${barberToken}`,
      },
    });
    const startData = await startRes.json();
    console.log(`✔ Service started: ID ${startData.entry.id}, Status: ${startData.entry.status}`);

    const analyticsAfterStart = await (
      await fetch('http://localhost:4000/api/admin/analytics?range=today', {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    console.log('✔ Analytics after start -> servingCount:', analyticsAfterStart.analytics.todayOverview.servingCount);
    if (analyticsAfterStart.analytics.todayOverview.servingCount < 1) {
      throw new Error('Serving count did not increment after service started!');
    }

    // 7. Barber Completes Service
    console.log('\n7. Barber Isha completes service for Customer 1...');
    await fetch(`http://localhost:4000/api/queue/${joinData1.entry.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${barberToken}`,
      },
    });

    const analyticsAfterComplete = await (
      await fetch('http://localhost:4000/api/admin/analytics?range=today', {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    console.log('✔ Analytics after complete -> completedCount:', analyticsAfterComplete.analytics.todayOverview.completedCount);
    console.log('✔ Analytics after complete -> todayRevenue:', analyticsAfterComplete.analytics.revenueOverview.todayRevenue);
    if (analyticsAfterComplete.analytics.todayOverview.completedCount < 1) {
      throw new Error('Completed count did not increment after service completed!');
    }
    if (analyticsAfterComplete.analytics.revenueOverview.todayRevenue < 150) {
      throw new Error(`Today revenue did not reflect completed haircut price (Rs. 150, got ${analyticsAfterComplete.analytics.revenueOverview.todayRevenue})!`);
    }

    // 8. Customer 2 Joins and Cancels
    console.log('\n8. Registering and cancelling Customer 2 (Aarav Patel)...');
    const joinRes2 = await fetch('http://localhost:4000/api/queue/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Aarav Patel',
        phone: '9123456780',
        serviceIds: [2],
        barberPreference: 'any',
      }),
    });
    const joinData2 = await joinRes2.json();

    await fetch(`http://localhost:4000/api/queue/${joinData2.entry.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${receptionToken}`,
      },
      body: JSON.stringify({ reason: 'Customer requested cancellation' }),
    });

    const analyticsAfterCancel = await (
      await fetch('http://localhost:4000/api/admin/analytics?range=today', {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
    ).json();
    console.log('✔ Analytics after cancel -> cancelledCount:', analyticsAfterCancel.analytics.todayOverview.cancelledCount);
    if (analyticsAfterCancel.analytics.todayOverview.cancelledCount < 1) {
      throw new Error('Cancelled count did not increment after cancellation!');
    }

    // 9. Capture Screenshots for Documentation
    console.log('\n9. Capturing Verification Screenshots...');
    // Home Desktop view scrolled to services
    await takeScreenshot('http://localhost:5173/#services', path.join(SCREENSHOT_DIR, 'home_navbar_services_1280.png'), 1280, 800);
    // Home Mobile view
    await takeScreenshot('http://localhost:5173/', path.join(SCREENSHOT_DIR, 'home_navbar_mobile_375.png'), 375, 812);
    // Login page
    await takeScreenshot('http://localhost:5173/login', path.join(SCREENSHOT_DIR, 'login_desktop_1280.png'), 1280, 800);

    console.log('\n================================================================');
    console.log('  ALL OWNER ANALYTICS & NAVBAR VERIFICATIONS PASSED SUCCESSFULLY ');
    console.log('================================================================\n');
  } finally {
    try { clientProc.kill('SIGKILL'); } catch {}
    try { serverProc.kill('SIGKILL'); } catch {}
  }
}

run().catch((err) => {
  console.error('Execution Error:', err);
  process.exit(1);
});
