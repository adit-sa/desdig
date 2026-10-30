const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const tables = {};
  let currentTable = null;

  for await (const line of rl) {
    const createMatch = line.match(/^CREATE TABLE [`"]([^`"]+)[`"]/);
    if (createMatch) {
      currentTable = createMatch[1];
      tables[currentTable] = { columns: [], rows: [] };
      continue;
    }

    if (currentTable && tables[currentTable].columns.length === 0) {
      if (line.includes('PRIMARY KEY') || line.includes('KEY ') || line.includes('ENGINE=')) {
        currentTable = null;
      } else {
        const colMatch = line.match(/^\s*[`"]([^`"]+)[`"]/);
        if (colMatch) {
          tables[currentTable].columns.push(colMatch[1]);
        }
      }
    }
  }

  console.log('Columns for tweb_desa_pamong:', tables['tweb_desa_pamong']?.columns);
  console.log('Columns for ref_jabatan:', tables['ref_jabatan']?.columns);
  console.log('Columns for artikel:', tables['artikel']?.columns);
  console.log('Columns for gambar_gallery:', tables['gambar_gallery']?.columns);
  console.log('Columns for keuangan:', tables['keuangan']?.columns);
  console.log('Columns for config:', tables['config']?.columns);
}

run();
