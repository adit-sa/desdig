const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql'), crlfDelay: Infinity });

let curTbl = '';
let found = 0;
rl.on('line', l => {
  const m = l.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
  if (m) curTbl = m[1];

  if (curTbl === 'artikel' && l.trim().startsWith('(') && found < 3) {
    found++;
    const clean = l.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    console.log(`\nArtikel ${found}:`);
    console.log('ID:', tokens[0]);
    console.log('Judul (tokens[8]):', tokens[8]);
    console.log('Tgl (tokens[5]):', tokens[5]);
    console.log('Slug (tokens[16]):', tokens[16]);
    console.log('Gambar (tokens[2]):', tokens[2]);
    console.log('Isi snippet (tokens[3]):', tokens[3]?.substring(0, 100));
  }
});
