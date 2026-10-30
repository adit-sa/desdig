const fs = require('fs');

async function testSplit() {
  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
  const startArtikel = content.indexOf("INSERT INTO `artikel`");
  const endArtikel = content.indexOf(";\n", startArtikel);
  const chunk = content.substring(startArtikel, endArtikel + 1);

  const lines = chunk.split('\n');
  let validCount = 0;
  let enabledCount = 0;
  const colLengths = new Set();
  const sampleTitles = [];

  for (const line of lines) {
    if (!line.trim().startsWith('(')) continue;
    const clean = line.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    colLengths.add(tokens.length);
    validCount++;

    // 0: id, 1: config_id, 2: gambar, 3: isi, 4: enabled, 5: tgl_upload, 6: id_kategori, 7: id_user, 8: judul, 16: slug, 17: hit
    const enabled = tokens[4];
    const judul = tokens[8];
    if (enabled === '1') {
      enabledCount++;
      if (sampleTitles.length < 5) sampleTitles.push({ id: tokens[0], judul, cat: tokens[6], hit: tokens[17], tgl: tokens[5] });
    }
  }

  console.log('Valid rows:', validCount);
  console.log('Enabled (published) rows:', enabledCount);
  console.log('Column counts detected:', Array.from(colLengths));
  console.log('Sample enabled articles:', sampleTitles);
}

testSplit();
