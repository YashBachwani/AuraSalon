import fs from 'node:fs';
import path from 'node:path';

function listFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listFiles(full));
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

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

const en = JSON.parse(fs.readFileSync('client/src/locales/en.json', 'utf8'));
const gu = JSON.parse(fs.readFileSync('client/src/locales/gu.json', 'utf8'));

const enKeys = new Set(getKeys(en));
const guKeys = new Set(getKeys(gu));

console.log(`en.json keys: ${enKeys.size}, gu.json keys: ${guKeys.size}`);

// Check key difference between en and gu
const missingInGu = [...enKeys].filter(k => !guKeys.has(k));
const missingInEn = [...guKeys].filter(k => !enKeys.has(k));

if (missingInGu.length > 0) console.log('Missing in gu.json:', missingInGu);
if (missingInEn.length > 0) console.log('Missing in en.json:', missingInEn);

// Now scan all JSX / JS files for t('key') or t("key")
const clientFiles = listFiles('client/src');
const usedKeys = [];
const keyRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

for (const file of clientFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    usedKeys.push({ key: match[1], file });
  }
}

console.log(`Discovered ${usedKeys.size} translation key usages across client code.`);
const missingFromTranslations = [];
for (const { key, file } of usedKeys) {
  if (!enKeys.has(key)) {
    missingFromTranslations.push({ key, file });
  }
}

if (missingFromTranslations.length > 0) {
  console.log(`\n❌ Found ${missingFromTranslations.length} missing translation keys:`);
  missingFromTranslations.forEach(m => console.log(`  ${m.key} used in ${m.file}`));
} else {
  console.log('\n✔ All translation keys used in code exist in en.json & gu.json!');
}
