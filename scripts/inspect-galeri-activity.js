const fs = require('fs');
const path = require('path');

const dir = 'c:/app/opensid/public/uploads/salupangkang/galeri';
const files = fs.readdirSync(dir);

const activityPhotos = files.filter(f => {
  if (f.startsWith('sedang_') || f.startsWith('kecil_')) return false;
  if (f.includes('100__sid__') || f.includes('80__sid__') || f.includes('30__sid__') || f.includes('0__sid__')) return false;
  return f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.PNG');
});

console.log('Activity photos in galeri (excluding pembangunan progress percentages):', activityPhotos.length);
console.log(activityPhotos);
