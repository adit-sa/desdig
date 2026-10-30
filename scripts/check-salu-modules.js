const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({
    where: { slug: 'salupangkang' },
    include: { modules: true },
  });
  console.log('Salupangkang modules count:', t.modules.length);
  console.log('Modules:', t.modules);
}
check().finally(() => p.$disconnect());
