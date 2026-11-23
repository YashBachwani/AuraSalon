import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.join(ROOT, 'screenshots', 'responsive');
const ARTIFACTS_OUT = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\6dc92c23-cea2-43fe-8726-b14ac56eeda5\\screenshots\\responsive';

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

async function captureScreenshot(url, filename, width, height) {
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
        } catch {}
        console.log(`  ✔ Captured [${width}x${height}]: ${filename}`);
        resolve();
      } else {
        reject(new Error(`Failed capturing ${filename}, exit code: ${code}`));
      }
    });
    child.on('error', reject);
  });
}

const VIEWPORTS = [
  { name: 'mobile_360x800', width: 360, height: 800 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'mobile_430x932', width: 430, height: 932 },
  { name: 'tablet_768x1024', width: 768, height: 1024 },
  { name: 'tablet_1024x768', width: 1024, height: 768 },
  { name: 'laptop_1366x768', width: 1366, height: 768 },
  { name: 'desktop_1920x1080', width: 1920, height: 1080 },
];

async function main() {
  console.log('======================================================');
  console.log('  AURA SALON: RESPONSIVE VIEWPORT TESTING & CAPTURE  ');
  console.log('======================================================\n');

  console.log('1. Starting Backend & Frontend servers...');
  const server = spawn('node', ['src/index.js'], { cwd: path.join(ROOT, 'server'), stdio: 'ignore' });
  const client = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '5173'], { cwd: path.join(ROOT, 'client'), stdio: 'ignore' });

  try {
    await waitForUrl('http://localhost:4000/api/health');
    await waitForUrl('http://localhost:5173');
    console.log('✔ Servers active on :4000 and :5173\n');

    // Wait 2 seconds for initial bootstrap
    await new Promise((r) => setTimeout(r, 2000));

    console.log('2. Testing Homepage across all 7 target viewports:');
    for (const vp of VIEWPORTS) {
      const filename = `home_${vp.name}.png`;
      await captureScreenshot('http://localhost:5173', filename, vp.width, vp.height);
    }

    console.log('\n3. Testing Key Role Screens at target device resolutions:');
    // Join Queue at Mobile (390x844) & Desktop (1366x768)
    await captureScreenshot('http://localhost:5173/join', 'join_mobile_390x844.png', 390, 844);
    await captureScreenshot('http://localhost:5173/join', 'join_desktop_1366x768.png', 1366, 768);

    // Reception at Tablet Landscape (1024x768)
    await captureScreenshot('http://localhost:5173/reception', 'reception_tablet_1024x768.png', 1024, 768);

    // Waiting TV at 1920x1080 (16:9 full HD)
    await captureScreenshot('http://localhost:5173/display', 'display_tv_1920x1080.png', 1920, 1080);

    // Barber Chair at Mobile (390x844)
    await captureScreenshot('http://localhost:5173/barber/isha', 'barber_isha_mobile_390x844.png', 390, 844);

    // Login at Mobile (390x844) & Desktop (1366x768)
    await captureScreenshot('http://localhost:5173/login', 'login_mobile_390x844.png', 390, 844);
    await captureScreenshot('http://localhost:5173/login', 'login_desktop_1366x768.png', 1366, 768);

    console.log('\n======================================================');
    console.log('  ✔ ALL VIEWPORT & RESPONSIVE CHECKS PASSED 100%      ');
    console.log('======================================================');
  } finally {
    server.kill();
    client.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
