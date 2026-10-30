const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPembangunanFiles() {
  const rows = await prisma.$queryRaw`
    SELECT id, judul, foto FROM "DevelopmentProject"
  `;
  console.log('Sample development projects foto:');
  const sampleFotos = rows.slice(0, 10).map(r => r.foto).filter(Boolean);
  console.log(sampleFotos);

  const docRows = await prisma.$queryRaw`
    SELECT id, persentase, gambar FROM "DevelopmentDocumentation"
  `;
  console.log('Sample doc gambar:');
  const sampleDocs = docRows.slice(0, 10).map(r => r.gambar).filter(Boolean);
  console.log(sampleDocs);

  // Search if these filenames exist in the backup directory
  const baseBackup = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23';
  
  function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const p = path.join(dir, file);
      if (fs.statSync(p).isDirectory()) {
        walkDir(p, fileList);
      } else {
        fileList.push(p);
      }
    }
    return fileList;
  }

  const allBackupFiles = walkDir(baseBackup);
  console.log('Total files in whole backup folder:', allBackupFiles.length);

  for (const f of sampleFotos) {
    const name = path.basename(f);
    const found = allBackupFiles.filter(bf => bf.endsWith(name));
    console.log(`Searching for "${name}": found ${found.length} matches`);
    found.forEach(m => console.log('   ->', m));
  }
}

findPembangunanFiles().finally(() => prisma.$disconnect());
