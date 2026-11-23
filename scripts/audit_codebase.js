import fs from 'node:fs';
import path from 'node:path';

function listFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listFiles(full));
    } else if (full.endsWith('.jsx') || full.endsWith('.js') || full.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

const clientFiles = listFiles('client/src');
console.log(`Checking ${clientFiles.length} client files...`);

let deadHrefs = [];
let consoleLogs = [];
let todoComments = [];

for (const file of clientFiles) {
  if (file.endsWith('.json')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (/href=["']#["']/i.test(line)) {
      deadHrefs.push({ file, line: idx + 1, text: line.trim() });
    }
    if (/console\.log/i.test(line)) {
      consoleLogs.push({ file, line: idx + 1, text: line.trim() });
    }
    if (/TODO|FIXME|HACK|XXX/i.test(line)) {
      todoComments.push({ file, line: idx + 1, text: line.trim() });
    }
  });
}

console.log(`\n--- Dead href="#" (${deadHrefs.length}) ---`);
deadHrefs.forEach(d => console.log(`${d.file}:${d.line} -> ${d.text}`));

console.log(`\n--- Console logs (${consoleLogs.length}) ---`);
consoleLogs.forEach(c => console.log(`${c.file}:${c.line} -> ${c.text}`));

console.log(`\n--- TODO/FIXME comments (${todoComments.length}) ---`);
todoComments.forEach(t => console.log(`${t.file}:${t.line} -> ${t.text}`));
