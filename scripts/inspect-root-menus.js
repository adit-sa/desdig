const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const menus = await p.$queryRaw`
    SELECT id, title, url, "orderIndex", "isVisible" 
    FROM "NavMenu" 
    WHERE "tenantId" = ${t.id} AND "parentId" IS NULL AND "isVisible" = true 
    ORDER BY "orderIndex" ASC
  `;
  console.log('Visible Root Menus (' + menus.length + '):');
  menus.forEach(m => console.log(`- [${m.orderIndex}] ${m.title} (${m.url})`));
}
run().finally(() => p.$disconnect());
