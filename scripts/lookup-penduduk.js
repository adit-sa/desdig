const fs = require('fs');
const readline = require('readline');

async function lookupPendudukNames(targetIds) {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const idSet = new Set(targetIds.map(String));
  const results = {};
  let curTbl = '';

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'tweb_penduduk' && line.trim().startsWith('(')) {
      // (id, config_id, 'nama', ...
      const rowMatch = line.match(/^\((\d+),\s*\d+,\s*'([^']+)'/);
      if (rowMatch && idSet.has(rowMatch[1])) {
        results[rowMatch[1]] = rowMatch[2];
      }
    }
  }

  console.log('Resolved Penduduk names for pamong:', results);
}

lookupPendudukNames([141, 158, 154, 144, 2135, 167, 1035, 1899, 937, 2143, 243]);
