import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(ROOT, 'screenshots');

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

function takeScreenshot(url, outputPath, width = 1280, height = 800) {
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
        console.log(`📸 Captured screenshot: ${path.basename(outputPath)} (${width}x${height})`);
        resolve();
      } else {
        reject(new Error(`Failed screenshot ${outputPath}, code: ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function run() {
  console.log('Starting preview server...');
  const clientProc = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], {
    cwd: path.join(ROOT, 'client'),
    stdio: 'ignore',
  });

  const serverProc = spawn('node', ['src/index.js'], {
    cwd: path.join(ROOT, 'server'),
    stdio: 'ignore',
  });

  try {
    await waitForUrl('http://localhost:5173');
    await waitForUrl('http://localhost:4000/api/health');

    // Desktop Login Screenshot
    await takeScreenshot('http://localhost:5173/login', path.join(SCREENSHOT_DIR, 'login_desktop_1280.png'), 1280, 800);
    // Mobile Login Screenshot
    await takeScreenshot('http://localhost:5173/login', path.join(SCREENSHOT_DIR, 'login_mobile_375.png'), 375, 812);
  } finally {
    try { clientProc.kill('SIGKILL'); } catch {}
    try { serverProc.kill('SIGKILL'); } catch {}
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
