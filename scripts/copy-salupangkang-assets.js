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

async function run() {
  const srcUserPict = path.join('C:', 'app', 'salupangkang.desa.id', 'desa', 'upload', 'user_pict');
  const destUserPict = path.join(process.cwd(), 'public', 'uploads', 'salupangkang', 'user_pict');
  console.log('Copying user_pict to', destUserPict);
  copyFolderSync(srcUserPict, destUserPict);

  const srcGaleri = path.join('C:', 'app', 'salupangkang.desa.id', 'desa', 'upload', 'galeri');
  const destGaleri = path.join(process.cwd(), 'public', 'uploads', 'salupangkang', 'galeri');
  console.log('Copying galeri to', destGaleri);
  copyFolderSync(srcGaleri, destGaleri);

  console.log('✅ Aset foto Salupangkang berhasil disalin ke folder public/uploads/salupangkang!');
}

run();
