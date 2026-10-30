const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPembangunanPhotos() {
  const projects = await prisma.$queryRaw`
    SELECT id, judul, foto FROM "DevelopmentProject"
  `;
  const docs = await prisma.$queryRaw`
    SELECT id, persentase, gambar FROM "DevelopmentDocumentation"
  `;

  console.log('Total projects:', projects.length);
  console.log('Total docs:', docs.length);

  let projFound = 0;
  let projMissing = 0;
  for (const p of projects) {
    if (!p.foto) continue;
    const base = path.basename(p.foto);
    const inPembangunan = fs.existsSync(path.join('c:/app/opensid/public/uploads/pembangunan', base));
    const inGaleri = fs.existsSync(path.join('c:/app/opensid/public/uploads/salupangkang/galeri', base));
    if (inPembangunan || inGaleri) {
      projFound++;
    } else {
      projMissing++;
      console.log('Missing project foto:', p.foto, 'title:', p.judul);
    }
  }

  let docFound = 0;
  let docMissing = 0;
  for (const d of docs) {
    if (!d.gambar) continue;
    const base = path.basename(d.gambar);
    const inPembangunan = fs.existsSync(path.join('c:/app/opensid/public/uploads/pembangunan', base));
    const inGaleri = fs.existsSync(path.join('c:/app/opensid/public/uploads/salupangkang/galeri', base));
    if (inPembangunan || inGaleri) {
      docFound++;
    } else {
      docMissing++;
      console.log('Missing doc gambar:', d.gambar);
    }
  }

  console.log(`Projects: Found ${projFound}, Missing ${projMissing}`);
  console.log(`Docs: Found ${docFound}, Missing ${docMissing}`);
}

checkPembangunanPhotos().finally(() => prisma.$disconnect());
