import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(ROOT, 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function waitForUrl(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Keep waiting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function takeScreenshot(url, outputPath, width, height) {
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
        console.log(`✔ Captured: ${path.basename(outputPath)} (${width}x${height})`);
        resolve();
      } else {
        reject(new Error(`Failed capturing screenshot ${outputPath}, exit code: ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function run() {
  console.log('1. Starting Backend Server...');
  const serverProc = spawn('node', ['src/index.js'], {
    cwd: path.join(ROOT, 'server'),
    stdio: 'ignore',
  });

  console.log('2. Starting Frontend Preview Server...');
  const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'ignore',
  });

  try {
    await waitForUrl('http://localhost:4000/api/health');
    console.log('✔ Backend is ready on http://localhost:4000');

    await waitForUrl('http://localhost:5173/');
    console.log('✔ Frontend is ready on http://localhost:5173');

    // Wait 2.5s for initial bootstrap fetch, fonts & render
    await new Promise((r) => setTimeout(r, 2500));

    // Capturing all target resolutions
    console.log('3. Capturing responsive screenshots via Headless Chrome...');
    await takeScreenshot(
      'http://localhost:5173/',
      path.join(OUT_DIR, 'home_mobile_375.png'),
      375,
      812
    );
    await takeScreenshot(
      'http://localhost:5173/',
      path.join(OUT_DIR, 'home_tablet_1024.png'),
      1024,
      768
    );
    await takeScreenshot(
      'http://localhost:5173/',
      path.join(OUT_DIR, 'home_desktop_1440.png'),
      1440,
      900
    );
    await takeScreenshot(
      'http://localhost:5173/join',
      path.join(OUT_DIR, 'join_mobile_375.png'),
      375,
      812
    );
    await takeScreenshot(
      'http://localhost:5173/join',
      path.join(OUT_DIR, 'join_desktop_1440.png'),
      1440,
      900
    );

    console.log('=== All Screenshots Successfully Captured in /screenshots ===');
  } finally {
    serverProc.kill();
    clientProc.kill();
  }
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
