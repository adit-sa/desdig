const fs = require('fs');
const readline = require('readline');

async function checkGalleryInBackup() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inGallery = false;
  const rows = [];

  for await (const line of rl) {
    if (line.includes('INSERT INTO `gambar_gallery`') || line.includes('INSERT INTO gambar_gallery')) {
      inGallery = true;
    } else if (inGallery && line.startsWith('INSERT INTO')) {
      inGallery = false;
    }

    if (inGallery) {
      rows.push(line);
    }
  }

  console.log('Total gallery lines in backup-on-2026-10-22-07-42-55.sql:', rows.length);
  rows.forEach(r => console.log(r));
}

checkGalleryInBackup();
