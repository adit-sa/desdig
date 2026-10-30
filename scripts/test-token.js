const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({ input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql'), crlfDelay: Infinity });

rl.on('line', l => {
  if (l.startsWith('(') && l.includes('LOMBA')) {
    console.log('Galeri line raw:', l);
    const clean = l.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    console.log('Tokens:');
    tokens.forEach((t, i) => console.log(i, t));
  }
});
