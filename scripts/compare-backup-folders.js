const fs = require('fs');
const path = require('path');

const backupBase = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/upload';
const publicBase = 'C:/app/opensid/public/uploads/salupangkang';

function compareFolder(subName) {
  const bFolder = path.join(backupBase, subName);
  const pFolder = path.join(publicBase, subName);

  if (!fs.existsSync(bFolder)) {
    console.log(`Backup folder ${subName} does not exist.`);
    return;
  }
  const bFiles = fs.readdirSync(bFolder);
  const pFiles = fs.existsSync(pFolder) ? fs.readdirSync(pFolder) : [];

  const missingInPublic = bFiles.filter(f => !pFiles.includes(f));
  console.log(`[${subName}] Backup has: ${bFiles.length}, Public has: ${pFiles.length}. Missing in Public: ${missingInPublic.length}`);
  if (missingInPublic.length > 0 && missingInPublic.length <= 10) {
    console.log(` Missing files in ${subName}:`, missingInPublic);
  }
}

['artikel', 'galeri', 'user_pict', 'media', 'thumbs', 'dokumen', 'gis', 'produk', 'widgets'].forEach(compareFolder);
