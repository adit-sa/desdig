const fs = require('fs');
const readline = require('readline');

async function test() {
  const rl = readline.createInterface({ input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql') });
  let curTbl = '';
  const katLines = [];
  const menuLines = [];
  let artikelCount = 0;

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'kategori' && line.trim().startsWith('(')) {
      katLines.push(line.trim());
    }
    if (curTbl === 'menu' && line.trim().startsWith('(')) {
      menuLines.push(line.trim());
    }
    if (curTbl === 'artikel' && line.trim().startsWith('(')) {
      artikelCount++;
    }
  }

  console.log('Categories found:', katLines.length);
  console.log('Category samples:', katLines.slice(0, 8));
  console.log('Menu lines found:', menuLines.length);
  console.log('Menu samples:', menuLines.slice(0, 10));
  console.log('Total artikel lines found:', artikelCount);
}
test();
