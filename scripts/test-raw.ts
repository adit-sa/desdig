import { prisma } from '../lib/prisma';

async function main() {
  const records = await prisma.$queryRaw<any[]>`SELECT * FROM "OfficialAttendance"`;
  console.log('✅ Berhasil membaca OfficialAttendance via Raw SQL:', records.length, 'baris');
  console.log('Sample record:', records[0]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
