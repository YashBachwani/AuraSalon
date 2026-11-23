import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');
const ARTIFACTS_OUT = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\6dc92c23-cea2-43fe-8726-b14ac56eeda5\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACTS_OUT)) fs.mkdirSync(ARTIFACTS_OUT, { recursive: true });

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

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.id && this.callbacks.has(data.id)) {
            const cb = this.callbacks.get(data.id);
            this.callbacks.delete(data.id);
            if (data.error) cb.reject(new Error(data.error.message));
            else cb.resolve(data.result);
          }
        } catch (e) {
          console.error('CDP parse error:', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artifactPath = path.join(ARTIFACTS_OUT, filename);
    fs.writeFileSync(localPath, buffer);
    try {
      fs.writeFileSync(artifactPath, buffer);
    } catch {}
    console.log(`  📸 Saved screenshot: ${filename}`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('1. Building and starting preview server & backend...');
  const serverProc = spawn('node', ['src/index.js'], {
    cwd: path.join(ROOT, 'server'),
    stdio: 'ignore',
  });

  const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'ignore',
  });

  let chromeProc = null;
  let cdp = null;

  try {
    await waitForUrl('http://localhost:4000/api/health');
    await waitForUrl('http://localhost:5173');
    console.log('✔ Backend & Frontend active.');

    // Obtain Owner Token
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'owner', pin: '5678' }),
    });
    const loginData = await loginRes.json();
    const ownerToken = loginData.token;
    console.log('✔ Logged in as Owner');

    // Launch Chrome with remote debugging
    chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '--hide-scrollbars',
      '--window-size=1280,850',
      'about:blank',
    ]);

    await waitForUrl('http://localhost:9222/json/list');
    const tabsRes = await fetch('http://localhost:9222/json/list');
    const tabs = await tabsRes.json();
    const targetWs = tabs[0]?.webSocketDebuggerUrl;
    if (!targetWs) throw new Error('No Chrome tab found for CDP');

    cdp = new CdpClient(targetWs);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    // --- SCREENSHOT 1: Static Homepage Hero (Desktop 1280x850) ---
    console.log('\nCapturing Static Homepage Hero (Desktop)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 1500));
    await cdp.captureScreenshot('home_hero_desktop_1280.png');

    // --- SCREENSHOT 2: Static Homepage Hero (Mobile 390x844) ---
    console.log('Capturing Static Homepage Hero (Mobile)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('home_hero_mobile_375.png');

    // Reset to Desktop for Admin Views
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Set Owner Token in localStorage and Navigate to /admin
    console.log('\nNavigating to Admin Portal with Owner Authentication...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise((r) => setTimeout(r, 1000));
    await cdp.send('Runtime.evaluate', {
      expression: `localStorage.setItem('aura_auth_token', '${ownerToken}');`,
    });

    await cdp.send('Page.navigate', { url: 'http://localhost:5173/admin' });
    await new Promise((r) => setTimeout(r, 2000));

    // --- SCREENSHOT 3: Owner Analytics Overview ---
    console.log('Capturing Owner Analytics & Stats Tab...');
    await cdp.captureScreenshot('admin_overview_stats_desktop.png');

    // --- SCREENSHOT 4: Manage Services Tab ---
    console.log('Switching to Manage Services Tab...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#tab-services')?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('admin_manage_services_desktop.png');

    // --- SCREENSHOT 5: Add Service Modal ---
    console.log('Opening Add New Service Modal...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#btn-add-service')?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('admin_add_service_modal.png');

    // Close modal
    await cdp.send('Runtime.evaluate', {
      expression: `
        const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Cancel' || b.textContent.trim() === 'રદ કરો');
        if (cancelBtn) cancelBtn.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // --- SCREENSHOT 6: Manage Barbers Tab ---
    console.log('Switching to Manage Barbers Tab...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#tab-barbers')?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('admin_manage_barbers_desktop.png');

    // --- SCREENSHOT 7: Add Barber Modal ---
    console.log('Opening Add New Stylist Modal...');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#btn-add-barber')?.click();`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    await cdp.captureScreenshot('admin_add_barber_modal.png');

    console.log('\n✔ All screenshots captured and copied to artifacts!');
  } finally {
    if (cdp) cdp.close();
    if (chromeProc) chromeProc.kill();
    serverProc.kill();
    clientProc.kill();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
