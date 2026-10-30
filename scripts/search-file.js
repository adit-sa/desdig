const fs = require('fs');
const path = require('path');

const base = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23';

function searchFile(name) {
  const matches = [];
  function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        walk(p);
      } else {
        if (f.toLowerCase().includes(name.toLowerCase())) {
          matches.push(p);
        }
      }
    }
  }
  walk(base);
  return matches;
}

console.log('Search PEMUDA 4:', searchFile('PEMUDA 4'));
console.log('Search PEMUDA:', searchFile('PEMUDA'));
console.log('Search blt ok:', searchFile('blt ok'));
console.log('Search 2023-08-10:', searchFile('2023-08-10'));
