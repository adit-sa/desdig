const fs = require('fs');
const readline = require('readline');

async function parseTableInserts(targetTable) {
  const fileStream = fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let capturing = false;
  let cols = [];
  let rawValues = [];

  for await (const line of rl) {
    if (line.startsWith(`INSERT INTO \`${targetTable}\``)) {
      capturing = true;
      const colMatch = line.match(/\((.+)\)\s*VALUES/);
      if (colMatch) {
        cols = colMatch[1].split(',').map(c => c.trim().replace(/[`"']/g, ''));
      }
      continue;
    }

    if (capturing) {
      if (line.trim().endsWith(';') || line.startsWith('INSERT INTO') || line.startsWith('ALTER TABLE') || line.startsWith('UNLOCK TABLES')) {
        if (line.trim().startsWith('(')) {
          rawValues.push(line.trim());
        }
        capturing = false;
      } else if (line.trim().startsWith('(')) {
        rawValues.push(line.trim());
      }
    }
  }

  return { cols, count: rawValues.length, sample: rawValues.slice(0, 10), all: rawValues };
}

async function run() {
  const pamong = await parseTableInserts('tweb_desa_pamong');
  console.log('--- PAMONG ---', pamong.cols);
  console.log('Count:', pamong.count);
  pamong.sample.forEach((s, i) => console.log(`  [${i}]`, s.substring(0, 150)));

  const refJabatan = await parseTableInserts('ref_jabatan');
  console.log('\n--- REF JABATAN ---', refJabatan.cols);
  refJabatan.sample.forEach((s, i) => console.log(`  [${i}]`, s));

  const config = await parseTableInserts('config');
  console.log('\n--- CONFIG ---', config.cols);
  config.sample.forEach((s, i) => console.log(`  [${i}]`, s));

  const artikel = await parseTableInserts('artikel');
  console.log('\n--- ARTIKEL ---', artikel.cols);
  console.log('Count:', artikel.count);
  artikel.sample.forEach((s, i) => console.log(`  [${i}]`, s.substring(0, 120)));

  const galeri = await parseTableInserts('gambar_gallery');
  console.log('\n--- GAMBAR GALLERY ---', galeri.cols);
  console.log('Count:', galeri.count);
  galeri.sample.forEach((s, i) => console.log(`  [${i}]`, s));

  const keuangan = await parseTableInserts('keuangan');
  console.log('\n--- KEUANGAN ---', keuangan.cols);
  console.log('Count:', keuangan.count);
  keuangan.sample.forEach((s, i) => console.log(`  [${i}]`, s));

  const keuanganRinci = await parseTableInserts('keuangan_manual_rinci');
  console.log('\n--- KEUANGAN RINCI ---', keuanganRinci.cols);
  console.log('Count:', keuanganRinci.count);
  keuanganRinci.sample.forEach((s, i) => console.log(`  [${i}]`, s));
}

run();
