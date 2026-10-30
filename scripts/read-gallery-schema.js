const fs = require('fs');
const content = fs.readFileSync('C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql', 'utf8');
const regex = /CREATE TABLE [`"]gambar_gallery[`"]\s*\(([\s\S]*?)\)\s*ENGINE/i;
const match = regex.exec(content);
if (match) {
  console.log('CREATE TABLE gambar_gallery:');
  console.log(match[1]);
} else {
  console.log('Not found CREATE TABLE gambar_gallery');
}
