const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql'),
  crlfDelay: Infinity,
});

let lineNum = 0;
let captureLines = 0;
let capturedTable = '';

rl.on('line', (line) => {
  lineNum++;

  if (captureLines > 0) {
    console.log(`[${capturedTable} +data line]`, line.substring(0, 300));
    captureLines--;
  }

  const match = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
  if (match) {
    const tbl = match[1];
    if (['config', 'tweb_desa_pamong', 'artikel', 'kategori', 'gambar_gallery', 'keuangan', 'dokumen'].includes(tbl)) {
      console.log(`\nFound table INSERT: ${tbl} at line ${lineNum}`);
      console.log(line.substring(0, 250));
      capturedTable = tbl;
      captureLines = 3;
    }
  }
});
