import fs from 'fs';
import readline from 'readline';

async function extractKeyTables() {
  const filePath = 'backup-on-2026-10-22-07-42-55.sql';
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let currentTable = '';
  const tableData: Record<string, string[]> = {};
  const targetTables = ['config', 'tweb_desa_pamong', 'artikel', 'kategori', 'gambar_gallery', 'keuangan', 'keuangan_manual_rinci', 'dokumen', 'media_sosial'];

  for await (const line of rl) {
    const tableMatch = line.match(/CREATE TABLE [`"']?([a-zA-Z0-9_]+)[`"']?/i);
    if (tableMatch) {
      currentTable = tableMatch[1];
    }

    if (line.startsWith('INSERT INTO')) {
      const insertMatch = line.match(/INSERT INTO [`"']?([a-zA-Z0-9_]+)[`"']?/i);
      if (insertMatch && targetTables.includes(insertMatch[1])) {
        if (!tableData[insertMatch[1]]) tableData[insertMatch[1]] = [];
        tableData[insertMatch[1]].push(line.substring(0, 1000)); // preview
      }
    }
  }

  for (const [tbl, lines] of Object.entries(tableData)) {
    console.log(`=== TABLE: ${tbl} === (${lines.length} insert statements)`);
    console.log(lines[0].substring(0, 400) + '...\n');
  }
}

extractKeyTables();
