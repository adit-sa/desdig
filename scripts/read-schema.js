const fs = require('fs');
const content = fs.readFileSync('C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql', 'utf8');
const regex = /CREATE TABLE [`"]artikel[`"]\s*\(([\s\S]*?)\)\s*ENGINE/i;
const match = regex.exec(content);
if (match) {
  console.log('CREATE TABLE artikel:');
  console.log(match[1]);
} else {
  console.log('Regex did not match');
}
