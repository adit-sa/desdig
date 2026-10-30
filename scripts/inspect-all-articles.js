const fs = require('fs');
const readline = require('readline');

async function inspectAllArticles() {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let curTbl = '';
  const categories = {};
  const articles = [];

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'kategori' && line.trim().startsWith('(')) {
      // (id, config_id, 'kategori', tipe, urut, enabled, parrent, 'slug')
      const clean = line.replace(/^\(/, '').replace(/[\);,]+$/, '');
      const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
      categories[tokens[0]] = { name: tokens[2], slug: tokens[7] || tokens[2].toLowerCase().replace(/\s+/g, '-') };
    }

    if (curTbl === 'artikel' && line.trim().startsWith('(')) {
      const clean = line.replace(/^\(/, '').replace(/[\);,]+$/, '');
      const tokens = clean.split('\t').map(t => t.trim().replace(/^['"]|['",]+$/g, '').trim());
      // 0: id, 1: config_id, 2: gambar, 3: isi, 4: enabled, 5: tgl_upload, 6: id_kategori, 7: id_user, 8: judul, 16: slug
      articles.push({
        id: tokens[0],
        gambar: tokens[2],
        enabled: tokens[4],
        tgl_upload: tokens[5],
        id_kategori: tokens[6],
        judul: tokens[8],
        slug: tokens[16],
      });
    }
  }

  console.log('Categories found:', categories);
  console.log('Total articles found:', articles.length);
  const enabledArticles = articles.filter(a => a.enabled === '1' && a.judul);
  console.log('Enabled articles with judul:', enabledArticles.length);
  console.log('Sample enabled articles:');
  enabledArticles.slice(0, 15).forEach((a, i) => console.log(`  [${i + 1}] ID ${a.id}: "${a.judul}" (Kat: ${categories[a.id_kategori]?.name || a.id_kategori})`));
}

inspectAllArticles();
