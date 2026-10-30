const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const officials = await p.villageOfficial.findMany({ 
    where: { tenantId: t.id }, 
    orderBy: { orderIndex: 'asc' } 
  });
  console.log('Total Officials:', officials.length);
  officials.forEach((o, i) => {
    console.log(`${i + 1}. [order: ${o.orderIndex}] ${o.name} - ${o.position} (NIP: ${o.nip || '-'}) foto: ${o.photoUrl ? 'YES' : 'NO'}`);
  });
}
check().finally(() => p.$disconnect());
