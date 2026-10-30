const fs = require('fs');
const path = require('path');

const galeriDir = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/upload/galeri';
const files = fs.readdirSync(galeriDir);
console.log('Total files in upload/galeri:', files.length);

const nonPrefix = files.filter(f => !f.startsWith('sedang_') && !f.startsWith('kecil_') && f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.PNG'));
console.log('Original photos (no prefix) count:', nonPrefix.length);
console.log('Sample original photos:', nonPrefix.slice(0, 30));
