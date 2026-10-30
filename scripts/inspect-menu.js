const fs = require('fs');
const readline = require('readline');

async function inspectMenuTable() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let curTbl = '';
  const menuLines = [];
  let menuCols = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `menu`')) {
      curTbl = 'menu';
      const m = line.match(/\((.+)\)\s*VALUES/);
      if (m) menuCols = m[1].split(',').map(c => c.trim().replace(/[`"']/g, ''));
      continue;
    }

    if (curTbl === 'menu') {
      if (line.trim().startsWith('(')) {
        menuLines.push(line.trim());
      } else {
        curTbl = '';
      }
    }
  }

  console.log('Menu Columns:', menuCols);
  console.log('Total Menu Rows:', menuLines.length);
  menuLines.forEach((m, i) => console.log(`[${i}]`, m));
}

inspectMenuTable();
