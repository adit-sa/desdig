const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const officials = await p.villageOfficial.findMany({ 
    where: { tenantId: t.id }, 
    orderBy: { orderIndex: 'asc' } 
  });
  console.log('Officials count:', officials.length);
  officials.slice(0, 5).forEach(o => {
    console.log(`- ${o.name} (${o.position}) photoUrl: ${o.photoUrl}`);
  });
}
run().finally(() => p.$disconnect());
