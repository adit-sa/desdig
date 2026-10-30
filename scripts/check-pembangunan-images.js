const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function checkPembangunan() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const projects = await prisma.developmentProject.findMany({
    where: { tenantId: tenant.id },
    include: { documentations: true }
  });
  console.log('Total development projects:', projects.length);
  for (const p of projects) {
    const fotoExists = p.foto && fs.existsSync(path.join('c:/app/opensid/public', p.foto));
    console.log(`- ${p.judul} (foto: ${p.foto}, exists: ${fotoExists})`);
    for (const d of p.documentations) {
      const docExists = d.gambar && fs.existsSync(path.join('c:/app/opensid/public', d.gambar));
      console.log(`   * ${d.persentase}%: ${d.gambar} (exists: ${docExists})`);
    }
  }
}

checkPembangunan().finally(() => prisma.$disconnect());
