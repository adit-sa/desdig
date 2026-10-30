const fs = require('fs');

async function testImages() {
  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
  const startArtikel = content.indexOf("INSERT INTO `artikel`");
  const endArtikel = content.indexOf(";\n", startArtikel);
  const chunk = content.substring(startArtikel, endArtikel + 1);

  const lines = chunk.split('\n');
  const diskFiles = fs.existsSync('public/uploads/salupangkang/artikel') 
    ? fs.readdirSync('public/uploads/salupangkang/artikel')
    : [];

  let withGambar = 0;
  let matched = 0;

  for (const line of lines) {
    if (!line.trim().startsWith('(')) continue;
    const clean = line.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    const gambar = tokens[2];
    const enabled = tokens[4];

    if (enabled === '1' && gambar && gambar !== 'NULL' && gambar !== '') {
      withGambar++;
      const match = diskFiles.find(f => f.includes(gambar) || gambar.includes(f));
      if (match) matched++;
    }
  }

  console.log('Enabled articles with gambar specified in DB:', withGambar);
  console.log('Matched files found in public/uploads/salupangkang/artikel:', matched);
  console.log('Total files in public/uploads/salupangkang/artikel:', diskFiles.length);
}

testImages();
