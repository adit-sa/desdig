const fs = require('fs');
const readline = require('readline');

async function checkCols() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `tweb_desa_pamong`')) {
      const match = line.match(/\((.+)\)\s*VALUES/);
      if (match) {
        const cols = match[1].split(',').map((c, i) => `${i}: ${c.trim()}`);
        console.log('Columns:');
        cols.forEach(c => console.log(c));
      }
      break;
    }
  }
}

checkCols();
