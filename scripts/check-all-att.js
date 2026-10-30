const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const allAtts = await p.$queryRaw`
    SELECT id, "tenantId", "officialId", "date", "status"
    FROM "OfficialAttendance"
    LIMIT 20
  `;
  console.log('All attendances in DB:', allAtts.length);
  console.log('Records:', allAtts);
}
check().finally(() => p.$disconnect());
