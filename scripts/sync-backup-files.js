const fs = require('fs');
const path = require('path');

const backupUpload = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/upload';
const backupLogo = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/logo';
const publicSalupangkang = 'C:/app/opensid/public/uploads/salupangkang';
const publicDesaUpload = 'C:/app/opensid/public/desa/upload';

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  let filesCopied = 0;
  for (const item of items) {
    if (item === '.htaccess' || item === 'index.html' || item === 'baca-ini.txt') continue;
    const curSource = path.join(source, item);
    const curTarget = path.join(target, item);

    if (fs.statSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      if (!fs.existsSync(curTarget)) {
        fs.copyFileSync(curSource, curTarget);
        filesCopied++;
      }
    }
  }
  return filesCopied;
}

console.log('--- Copying all backup upload subfolders to public/uploads/salupangkang ---');
if (fs.existsSync(backupUpload)) {
  const subs = fs.readdirSync(backupUpload);
  for (const sub of subs) {
    const sPath = path.join(backupUpload, sub);
    if (fs.statSync(sPath).isDirectory()) {
      const tPath = path.join(publicSalupangkang, sub);
      const copied = copyFolderRecursiveSync(sPath, tPath);
      console.log(`Copied ${sub} -> ${tPath}`);
    }
  }
}

if (fs.existsSync(backupLogo)) {
  const tLogo = path.join(publicSalupangkang, 'logo');
  copyFolderRecursiveSync(backupLogo, tLogo);
  console.log(`Copied logo -> ${tLogo}`);
}

console.log('--- Mirroring to public/desa/upload for legacy URLs ---');
if (fs.existsSync(backupUpload)) {
  const subs = fs.readdirSync(backupUpload);
  for (const sub of subs) {
    const sPath = path.join(backupUpload, sub);
    if (fs.statSync(sPath).isDirectory()) {
      const tPath = path.join(publicDesaUpload, sub);
      copyFolderRecursiveSync(sPath, tPath);
    }
  }
  console.log(`Mirrored all upload directories to ${publicDesaUpload}`);
}

console.log('Sync complete!');
