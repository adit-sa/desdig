const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const articlesCount = await p.article.count({ where: { tenantId: t.id } });
  const menuCount = await p.$queryRaw`SELECT count(*)::int as c FROM "NavMenu" WHERE "tenantId" = ${t.id}`;
  const visibleMenuCount = await p.$queryRaw`SELECT count(*)::int as c FROM "NavMenu" WHERE "tenantId" = ${t.id} AND "isVisible" = true`;
  const recentArticles = await p.article.findMany({
    where: { tenantId: t.id },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: { id: true, title: true, coverImageUrl: true, publishedAt: true }
  });
  console.log('Tenant:', t.namaDesa);
  console.log('Total articles in DB:', articlesCount);
  console.log('Total menus in DB:', menuCount[0].c);
  console.log('Visible menus in DB:', visibleMenuCount[0].c);
  console.log('Recent 5 articles:', recentArticles);
}
run().finally(() => p.$disconnect());
