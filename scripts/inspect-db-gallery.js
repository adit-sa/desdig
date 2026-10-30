const fs = require('fs');
const content = fs.readFileSync('C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql', 'utf8');

const regex = /INSERT INTO [`"]gambar_gallery[`"].*?VALUES\s*([\s\S]*?);/g;
let match;
let total = 0;
const galleries = [];

while ((match = regex.exec(content)) !== null) {
  const valuesStr = match[1];
  // Parse tuples like (1, 1, 0, '...', ...)
  const rowRegex = /\((\d+),\s*(\d+|NULL),\s*(\d+|NULL),\s*'([^']*)',\s*'([^']*)'/g;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(valuesStr)) !== null) {
    total++;
    galleries.push({
      id: rowMatch[1],
      config_id: rowMatch[2],
      parrent: rowMatch[3],
      gambar: rowMatch[4],
      nama: rowMatch[5],
    });
  }
}

console.log('Total gambar_gallery in db_asli.sql:', total);
console.log('Sample galleries:', galleries.slice(0, 10));
