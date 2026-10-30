const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const element of fs.readdirSync(from)) {
    if (element === 'PaxHeaders.0' || element === '.htaccess') continue;
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

const src = path.join('C:', 'app', 'salupangkang.desa.id', 'desa', 'upload', 'artikel');
const dest = path.join(process.cwd(), 'public', 'uploads', 'salupangkang', 'artikel');
console.log('Copying artikel images from', src, 'to', dest);
copyFolderSync(src, dest);
console.log('✅ Aset foto artikel berhasil disalin!');
