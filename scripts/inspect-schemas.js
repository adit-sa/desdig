const fs = require('fs');
const readline = require('readline');

async function inspectSchema() {
  const rl = readline.createInterface({ input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql') });
  let capturing = null;
  const schemas = {};

  for await (const line of rl) {
    const match = line.match(/^CREATE TABLE [`"]([^`"]+)[`"]/);
    if (match) {
      if (['kategori', 'menu', 'artikel'].includes(match[1])) {
        capturing = match[1];
        schemas[capturing] = [line];
        continue;
      }
    }
    if (capturing) {
      schemas[capturing].push(line);
      if (line.includes(';')) {
        capturing = null;
      }
    }
  }

  for (const [tbl, lines] of Object.entries(schemas)) {
    console.log(`=== ${tbl} ===`);
    console.log(lines.join('\n'));
  }
}
inspectSchema();
