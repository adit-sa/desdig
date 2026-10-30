const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  const officials = await p.villageOfficial.findMany({ where: { tenantId: t.id }, orderBy: { orderIndex: 'asc' } });
  const allAtts = await p.$queryRaw`
    SELECT * FROM "OfficialAttendance" WHERE "tenantId" = ${t.id}
  `;
  console.log('Officials count:', officials.length);
  console.log('Atts for Salupangkang in DB:', allAtts.length);
  if (officials.length > 0 && allAtts.length > 0) {
    const match = officials.find(o => o.id === allAtts[0].officialId);
    console.log('First att officialId:', allAtts[0].officialId);
    console.log('First official ID:', officials[0].id);
    console.log('Match found?:', !!match);
  }
}
check().finally(() => p.$disconnect());
