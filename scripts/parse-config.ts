import fs from 'fs';
import readline from 'readline';

async function parseConfig() {
  const filePath = 'backup-on-2026-10-22-07-42-55.sql';
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let configCols: string[] = [];
  let inConfigCreate = false;

  for await (const line of rl) {
    if (line.includes('CREATE TABLE `config`')) {
      inConfigCreate = true;
      continue;
    }
    if (inConfigCreate) {
      if (line.includes('PRIMARY KEY') || line.includes('KEY ') || line.includes('ENGINE=')) {
        inConfigCreate = false;
      } else {
        const colMatch = line.match(/^\s*`([a-zA-Z0-9_]+)`/);
        if (colMatch) {
          configCols.push(colMatch[1]);
        }
      }
    }

    if (line.startsWith('INSERT INTO `config`')) {
      console.log('Columns in `config`:', configCols);
      // parse values
      const valIndex = line.indexOf('VALUES');
      const valStr = line.substring(valIndex + 6).trim();
      console.log('Values raw length:', valStr.length);
      console.log('Values snippet:', valStr.substring(0, 1500));
      break;
    }
  }
}

parseConfig();
