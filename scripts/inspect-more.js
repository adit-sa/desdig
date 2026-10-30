const fs = require('fs');
const readline = require('readline');

async function inspectMore() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let curTbl = '';
  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];
    if (curTbl === 'profil_desa' && line.trim().startsWith('(')) {
      console.log('profil_desa line:', line.substring(0, 500));
    }
  }
}

inspectMore();
