import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Membuat tabel DevelopmentProject & DevelopmentDocumentation jika belum ada...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DevelopmentProject" (
      "id" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "judul" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "keterangan" TEXT,
      "lokasi" TEXT,
      "tahunAnggaran" INTEGER DEFAULT 2024,
      "anggaran" BIGINT DEFAULT 0,
      "volume" TEXT,
      "pelaksanaKegiatan" TEXT,
      "sumberDana" TEXT,
      "manfaat" TEXT,
      "waktu" TEXT,
      "sifatProyek" TEXT DEFAULT 'BARU',
      "status" TEXT DEFAULT 'Proses',
      "progressPersen" INTEGER DEFAULT 0,
      "foto" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DevelopmentProject_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "DevelopmentProject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "DevelopmentProject_tenantId_slug_key" 
    ON "DevelopmentProject"("tenantId", "slug");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "DevelopmentProject_tenantId_tahunAnggaran_idx" 
    ON "DevelopmentProject"("tenantId", "tahunAnggaran");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DevelopmentDocumentation" (
      "id" TEXT NOT NULL,
      "projectId" TEXT NOT NULL,
      "persentase" TEXT NOT NULL,
      "keterangan" TEXT,
      "gambar" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DevelopmentDocumentation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "DevelopmentDocumentation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DevelopmentProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "DevelopmentDocumentation_projectId_idx" 
    ON "DevelopmentDocumentation"("projectId");
  `);

  console.log('Tabel Pembangunan berhasil disiapkan di PostgreSQL!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
