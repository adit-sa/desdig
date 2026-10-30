const fs = require('fs');
const readline = require('readline');

async function getPamong() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let curTbl = '';
  const jabatans = {};
  const pamongs = [];

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'ref_jabatan' && line.trim().startsWith('(')) {
      // (1, 1, 'Kepala Desa', ...
      const rowMatch = line.match(/\((\d+),\s*\d+,\s*'([^']+)'/);
      if (rowMatch) {
        jabatans[rowMatch[1]] = rowMatch[2];
      }
    }

    if (curTbl === 'tweb_desa_pamong' && line.trim().startsWith('(')) {
      pamongs.push(line.trim());
    }
  }

  console.log('Jabatans:', jabatans);
  console.log('Total pamong lines:', pamongs.length);
  pamongs.forEach(p => console.log(p.substring(0, 160)));
}

getPamong();
