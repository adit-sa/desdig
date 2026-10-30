const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function inspectOfficials() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const officials = await prisma.villageOfficial.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, position: true, photoUrl: true }
  });

  console.log(`Total officials for ${tenant.namaDesa}: ${officials.length}`);
  const userPictDir = 'c:/app/opensid/public/uploads/salupangkang/user_pict';
  const pictFiles = fs.readdirSync(userPictDir);
  console.log(`Total files in user_pict: ${pictFiles.length}`);

  let nullCount = 0;
  for (const off of officials) {
    if (!off.photoUrl) {
      nullCount++;
      console.log(`[NO PHOTO] ${off.name} (${off.position})`);
    } else {
      const exists = fs.existsSync(path.join('c:/app/opensid/public', off.photoUrl));
      if (!exists) {
        console.log(`[MISSING PHOTO FILE] ${off.name} -> ${off.photoUrl}`);
      }
    }
  }
  console.log(`Total with null photo: ${nullCount}`);
}

inspectOfficials().finally(() => prisma.$disconnect());
