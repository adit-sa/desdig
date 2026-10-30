const fs = require('fs');
const readline = require('readline');

async function checkPamong() {
  const fileStream = fs.createReadStream('C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inPamong = false;
  for await (const line of rl) {
    if (line.includes('INSERT INTO `tweb_desa_pamong`')) {
      inPamong = true;
    } else if (inPamong && line.startsWith('INSERT INTO')) {
      inPamong = false;
    }
    if (inPamong) {
      if (line.includes('SUJOKO') || line.includes('SUKARJANA') || line.includes('BAGUS')) {
        console.log('Found line:', line);
      }
    }
  }
}
checkPamong();
