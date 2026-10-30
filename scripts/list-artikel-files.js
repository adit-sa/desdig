const fs = require('fs');
const path = require('path');

const artikelUploadDir = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/upload/artikel';
const files = fs.readdirSync(artikelUploadDir);
console.log('Total files in upload/artikel:', files.length);

// Print sample files
console.log('Sample files:', files.slice(0, 30));
