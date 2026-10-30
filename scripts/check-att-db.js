const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const officials = await p.villageOfficial.findMany({ where: { tenantId: t.id }, orderBy: { orderIndex: 'asc' } });
  const todayStr = new Date().toISOString().split('T')[0];
  const atts = await p.$queryRaw`
    SELECT * FROM "OfficialAttendance"
    WHERE "tenantId" = ${t.id} AND "date"::date = ${todayStr}::date
  `;
  console.log('Tenant:', t.namaDesa);
  console.log('Today string:', todayStr);
  console.log('Officials count:', officials.length);
  console.log('Attendances count today:', atts.length);
  if (atts.length > 0) {
    console.log('Sample attendance:', atts.slice(0, 3));
  }
}
check().finally(() => p.$disconnect());
