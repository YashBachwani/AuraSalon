import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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
  console.log('====================================================');
  console.log('  AURA SALON: 3D HOMEPAGE SCREENSHOT CAPTURE        ');
  console.log('====================================================\n');

  console.log('1. Starting Frontend Client Preview Server on :5173...');
  const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'ignore',
  });

  try {
    await waitForUrl('http://localhost:5173');
    console.log('✔ Frontend preview server ready on http://localhost:5173');

    // Wait a brief moment for assets
    await new Promise((r) => setTimeout(r, 1000));

    console.log('\n2. Capturing 3D Homepage Screenshots in Chrome...');
    await takeScreenshot(
      'http://localhost:5173',
      path.join(SCREENSHOT_DIR, 'home_3d_desktop_1280.png'),
      1280,
      800
    );
    await takeScreenshot(
      'http://localhost:5173',
      path.join(SCREENSHOT_DIR, 'home_3d_mobile_375.png'),
      375,
      812
    );

    console.log('\n✔ Successfully captured 3D Homepage Desktop & Mobile screenshots!');
  } finally {
    clientProc.kill();
  }
}

run().catch((err) => {
  console.error('❌ Failed to capture 3D homepage screenshots:', err);
  process.exit(1);
});
