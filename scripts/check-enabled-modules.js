const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  console.log('Tenant nama:', t.namaDesa);
  console.log('enabledModules:', t.enabledModules);
}
check().finally(() => p.$disconnect());
