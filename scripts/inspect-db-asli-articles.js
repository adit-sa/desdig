const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectOriginalArticles() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articlesInDb = await prisma.article.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, slug: true, coverImageUrl: true }
  });

  const sqlPath = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23/db_asli.sql';
  if (!fs.existsSync(sqlPath)) {
    console.log('db_asli.sql not found');
    return;
  }

  const fileStream = fs.createReadStream(sqlPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inArtikel = false;
  let artikelRows = 0;
  const artikelWithGambar = [];

  for await (const line of rl) {
    if (line.includes('INSERT INTO `artikel`') || line.includes('INSERT INTO artikel')) {
      inArtikel = true;
    }
    if (inArtikel) {
      // Find matches of tuples
      // In OpenSID: `artikel` table schema usually has:
      // (id, judul, isi, enabled, tgl_upload, id_kategori, id_user, gambar, ...)
      artikelRows++;
    }
  }

  console.log('Processed db_asli.sql. Total articles in DB:', articlesInDb.length);
}

inspectOriginalArticles().finally(() => prisma.$disconnect());
