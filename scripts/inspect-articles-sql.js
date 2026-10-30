const fs = require('fs');

const content = fs.readFileSync('C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql', 'utf8');

// Regex for INSERT INTO `artikel`
const regex = /INSERT INTO [`"]artikel[`"].*?VALUES\s*([\s\S]*?);/g;
let match;
let count = 0;
const articlesWithImages = [];

while ((match = regex.exec(content)) !== null) {
  const valuesStr = match[1];
  // Parse rows: (`id`, `config_id`, `gambar`, `isi`, `enabled`, `tgl_upload`, `id_kategori`, `id_user`, `judul`, `headline`, `gambar1`, `gambar2`, `gambar3`...)
  // Let's use a sql parser or regex matching lines
  const lines = valuesStr.split(/\),\s*\(/);
  for (const line of lines) {
    count++;
    // Let's extract values
  }
}

console.log('Total articles found in sql:', count);
