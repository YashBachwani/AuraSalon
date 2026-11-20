import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(ROOT, 'screenshots');
const ARTIFACTS_OUT = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\6dc92c23-cea2-43fe-8726-b14ac56eeda5\\screenshots';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(ARTIFACTS_OUT)) fs.mkdirSync(ARTIFACTS_OUT, { recursive: true });

async function waitForUrl(url, timeoutMs = 15000) {
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

async function takeScreenshot(url, filename, width, height) {
  const localPath = path.join(OUT_DIR, filename);
  const artifactPath = path.join(ARTIFACTS_OUT, filename);
  
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      `--screenshot=${localPath}`,
      url,
    ];

    const child = spawn(CHROME_PATH, args);
    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(localPath)) {
        try {
          fs.copyFileSync(localPath, artifactPath);
        } catch (e) {}
        console.log(`✔ Captured: ${filename} (${width}x${height})`);
        resolve();
      } else {
        reject(new Error(`Failed capturing ${filename}, code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

async function main() {
  console.log('1. Starting Backend & Frontend for hero screenshot capture...');
  const server = spawn('node', ['src/index.js'], { cwd: path.join(ROOT, 'server'), stdio: 'ignore' });
  const client = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], { cwd: path.join(ROOT, 'client'), stdio: 'ignore' });

  try {
    await waitForUrl('http://localhost:4000/api/health');
    await waitForUrl('http://localhost:5173');
    console.log('✔ Servers active on :4000 and :5173');

    // Wait a brief moment for Three.js 3D canvas rendering
    await new Promise((r) => setTimeout(r, 2500));

    await takeScreenshot('http://localhost:5173', 'home_hero_desktop_1280.png', 1280, 900);
    await takeScreenshot('http://localhost:5173', 'home_hero_mobile_375.png', 375, 812);

    console.log('✔ All hero screenshots captured successfully!');
  } finally {
    server.kill();
    client.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
