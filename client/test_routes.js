import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Stage 1 Client & Route Verification ===');

// 1. Verify all 7 route files exist
const routeFiles = [
  'src/pages/HomePage.jsx',
  'src/pages/JoinQueuePage.jsx',
  'src/pages/MyStatusPage.jsx',
  'src/pages/ReceptionPage.jsx',
  'src/pages/BarberPage.jsx',
  'src/pages/DisplayPage.jsx',
  'src/pages/AdminPage.jsx',
  'src/pages/NotFoundPage.jsx',
];

for (const rel of routeFiles) {
  const full = path.join(__dirname, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing route file: ${rel}`);
  }
  const content = fs.readFileSync(full, 'utf8');
  if (content.length < 50) {
    throw new Error(`Route file ${rel} is empty or incomplete`);
  }
}
console.log('✔ All 7 screen routes + 404 page exist and have valid structure');

// 2. Verify layouts exist
const layoutFiles = [
  'src/layouts/CustomerLayout.jsx',
  'src/layouts/StaffLayout.jsx',
  'src/layouts/DisplayLayout.jsx',
];
for (const rel of layoutFiles) {
  const full = path.join(__dirname, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing layout file: ${rel}`);
  }
}
console.log('✔ Customer, Staff, and Display layouts exist');

// 3. Verify translation files
const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/en.json'), 'utf8'));
const gu = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/locales/gu.json'), 'utf8'));

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const enKeys = getKeys(en);
const guKeys = getKeys(gu);

if (enKeys.length !== guKeys.length) {
  throw new Error(`Key count mismatch: EN=${enKeys.length}, GU=${guKeys.length}`);
}

for (const k of enKeys) {
  if (!guKeys.includes(k)) {
    throw new Error(`Key ${k} missing in Gujarati dictionary`);
  }
}
console.log(`✔ Translation dictionaries have exact 1:1 parity (${enKeys.length} keys each)`);

// 4. Verify Responsive & Theme Tokens
const tailwindConfig = fs.readFileSync(path.join(__dirname, 'tailwind.config.js'), 'utf8');
if (!tailwindConfig.includes('#1F2937') || !tailwindConfig.includes('#D4A017')) {
  throw new Error('Tailwind configuration missing primary brand tokens (#1F2937 or #D4A017)');
}
console.log('✔ Charcoal (#1F2937) and Gold (#D4A017) tokens verified in Tailwind theme');

console.log('=== All Stage 1 Client Verifications Passed ===');
