import fs from 'fs';
import readline from 'readline';

async function scan() {
  const filePath = 'backup-on-2026-10-22-07-42-55.sql';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const tables = new Set<string>();
  const insertCounts: Record<string, number> = {};

  for await (const line of rl) {
    const tableMatch = line.match(/CREATE TABLE [`"']?([a-zA-Z0-9_]+)[`"']?/i);
    if (tableMatch) {
      tables.add(tableMatch[1]);
    }
    const insertMatch = line.match(/INSERT INTO [`"']?([a-zA-Z0-9_]+)[`"']?/i);
    if (insertMatch) {
      const tbl = insertMatch[1];
      insertCounts[tbl] = (insertCounts[tbl] || 0) + 1;
    }
  }

  console.log('Total Tables found:', tables.size);
  console.log('Tables with INSERT data:');
  const sorted = Object.entries(insertCounts).sort((a, b) => b[1] - a[1]);
  for (const [tbl, count] of sorted) {
    console.log(`  ${tbl}: ${count} insert lines`);
  }
}

scan();
