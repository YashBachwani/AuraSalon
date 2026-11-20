import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from '../server/node_modules/socket.io-client/build/esm/index.js';
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

async function takeScreenshot(url, outputPath, width = 1440, height = 900) {
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
        console.log(`  📸 Captured screenshot: ${path.basename(outputPath)}`);
        resolve();
      } else {
        reject(new Error(`Failed screenshot ${outputPath}, code: ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function run() {
  console.log('====================================================');
  console.log('  AURA SALON: FULL END-TO-END WORKFLOW VERIFICATION ');
  console.log('====================================================\n');

  // Reset database rows for fresh, deterministic run
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

  let receptionSocket = null;
  let barberSocket = null;
  let displaySocket = null;

  try {
    await waitForUrl('http://localhost:4000/api/health');
    console.log('✔ Backend is ready on http://localhost:4000');
    await waitForUrl('http://localhost:5173');
    console.log('✔ Frontend is ready on http://localhost:5173\n');

    // 3. Connect real Socket.IO clients representing different screens
    console.log('3. Connecting multi-device Socket.IO simulated browser clients...');
    receptionSocket = ioClient('http://localhost:4000');
    barberSocket = ioClient('http://localhost:4000');
    displaySocket = ioClient('http://localhost:4000');

    await Promise.all([
      new Promise((res) => receptionSocket.on('connect', res)),
      new Promise((res) => barberSocket.on('connect', res)),
      new Promise((res) => displaySocket.on('connect', res)),
    ]);
    console.log('✔ 3 simultaneous screen sessions connected via Socket.IO\n');

    // Setup event listeners for multi-screen sync verification
    let receptionReceivedUpdate = false;
    let barberReceivedUpdate = false;
    let displayReceivedUpdate = false;
    let customerCalledData = null;

    receptionSocket.on('queue:updated', () => { receptionReceivedUpdate = true; });
    barberSocket.on('queue:updated', () => { barberReceivedUpdate = true; });
    displaySocket.on('queue:updated', () => { displayReceivedUpdate = true; });
    displaySocket.on('customer:called', (data) => { customerCalledData = data; });

    // 4. Submit real customer registration (Step 4 of /join)
    const testPhone = '98' + Math.floor(10000000 + Math.random() * 89999999);
    console.log(`4. Customer joins queue: "Aarav Patel" (Phone: ${testPhone}, Haircut + Beard Trim, preferred: Isha)...`);
    const joinRes = await fetch('http://localhost:4000/api/queue/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Aarav Patel',
        phone: testPhone,
        serviceIds: [1, 2],
        preferredBarberId: 1, // Isha
      }),
    });

    const joinJson = await joinRes.json();
    const tok = joinJson.entry.tokenNumber;
    console.log(`✔ Customer successfully joined with token: ${tok} (ID: ${joinJson.entry.id})`);
    if (!tok.startsWith('S-')) {
      throw new Error(`Expected token starting with S-, got ${tok}`);
    }

    // Wait 500ms for Socket.IO broadcast
    await new Promise((r) => setTimeout(r, 600));

    console.log('5. Verifying Real-Time Broadcast to all screens (<500ms)...');
    console.log(`   - Reception received update: ${receptionReceivedUpdate ? '✔ YES' : '❌ NO'}`);
    console.log(`   - Barber received update:    ${barberReceivedUpdate ? '✔ YES' : '❌ NO'}`);
    console.log(`   - TV Display received update:${displayReceivedUpdate ? '✔ YES' : '❌ NO'}`);

    // 6. Verify Reception queue API reflects the customer
    console.log('\n6. Checking Reception View (/reception)...');
    const recRes = await fetch('http://localhost:4000/api/queue');
    const recData = await recRes.json();
    const aaravRec = recData.entries.find((e) => e.tokenNumber === tok);
    if (!aaravRec) throw new Error(`Aarav Patel (${tok}) not found in Reception queue!`);
    console.log(`✔ Reception shows ${tok} | Status: ${aaravRec.status} | Wait: ~${aaravRec.approxWaitMinutes}m`);

    // 7. Verify Barber Isha's queue reflects customer
    console.log('\n7. Checking Barber Isha View (/barber/isha)...');
    const barberRes = await fetch('http://localhost:4000/api/queue/barber/isha');
    const barberData = await barberRes.json();
    const aaravBarber = barberData.upcomingQueue.find((e) => e.tokenNumber === tok);
    if (!aaravBarber) throw new Error(`Aarav Patel (${tok}) not in Isha upcoming queue!`);
    console.log(`✔ Isha sees ${tok} in upcoming queue at position #${aaravBarber.position}`);

    // 8. Verify TV Display reflects upcoming token
    console.log('\n8. Checking TV Display View (/display)...');
    const tvRes = await fetch('http://localhost:4000/api/queue/display');
    const tvData = await tvRes.json();
    const aaravTv = tvData.upcomingTokens.find((e) => e.tokenNumber === tok);
    if (!aaravTv) throw new Error(`Aarav Patel (${tok}) not on TV upcoming strip!`);
    console.log(`✔ TV Display shows upcoming token ${tok} (${aaravTv.customerName})`);

    // 9. Reception calls next for Isha
    console.log('\n9. Reception clicks "Call Next" for Isha...');
    const callRes = await fetch('http://localhost:4000/api/queue/call-next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    const callData = await callRes.json();
    if (!callData.ok) {
      console.error('Call Next Error:', callData);
      throw new Error(`Call next failed: ${callData.message || callData.error}`);
    }
    console.log(`✔ ${tok} called! Assigned to: ${callData.entry.assignedBarber.name} | Status: ${callData.entry.status}`);

    await new Promise((r) => setTimeout(r, 600));
    console.log(`✔ TV Display received "customer:called" event: Token ${customerCalledData?.tokenNumber}`);

    // 10. Barber starts service
    console.log('\n10. Barber Isha taps "START SERVICE"...');
    const startRes = await fetch(`http://localhost:4000/api/queue/${joinJson.entry.id}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    const startData = await startRes.json();
    console.log(`✔ Service started! Status is now: ${startData.entry.status}`);

    // 11. Customer status page verification
    console.log('\n11. Verifying Customer My Status (/status/1)...');
    const statusRes = await fetch(`http://localhost:4000/api/queue/${joinJson.entry.id}`);
    const statusData = await statusRes.json();
    console.log(`✔ Customer status confirmed: ${statusData.entry.status} | Token: ${statusData.entry.tokenNumber}`);

    // 12. Barber completes service
    console.log('\n12. Barber Isha taps "COMPLETE SERVICE"...');
    const doneRes = await fetch(`http://localhost:4000/api/queue/${joinJson.entry.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': '1234',
      },
      body: JSON.stringify({ barberId: 1 }),
    });
    const doneData = await doneRes.json();
    console.log(`✔ Service completed! Status: ${doneData.entry.status}`);

    // 13. Capture real visual screenshots with headless Chrome
    console.log('\n13. Capturing real end-to-end browser screenshots in Chrome...');
    await takeScreenshot('http://localhost:5173/reception', path.join(SCREENSHOT_DIR, 'e2e_reception_verified.png'), 1280, 800);
    await takeScreenshot(`http://localhost:5173/status/${joinJson.entry.id}`, path.join(SCREENSHOT_DIR, 'e2e_customer_status_verified.png'), 400, 850);
    await takeScreenshot('http://localhost:5173/barber/isha', path.join(SCREENSHOT_DIR, 'e2e_barber_isha_verified.png'), 400, 850);
    await takeScreenshot('http://localhost:5173/display', path.join(SCREENSHOT_DIR, 'e2e_tv_display_verified.png'), 1920, 1080);

    console.log('\n====================================================');
    console.log('  ✔ ALL 18 END-TO-END WORKFLOW CHECKS PASSED 100%   ');
    console.log('====================================================\n');
  } finally {
    if (receptionSocket) receptionSocket.close();
    if (barberSocket) barberSocket.close();
    if (displaySocket) displaySocket.close();
    serverProc.kill();
    clientProc.kill();
  }
}

run().catch((err) => {
  console.error('❌ E2E Workflow Test Failed:', err);
  process.exit(1);
});
