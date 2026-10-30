const fs = require('fs');
const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf-8');
const lines = content.split('\n');
for (const line of lines) {
  if (line.includes('Tata Cara Permohonan Informasi') || line.includes('PPID') || line.includes('18 Indikator')) {
    console.log(line);
  }
}
