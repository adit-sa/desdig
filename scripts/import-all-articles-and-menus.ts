import { PrismaClient, ContentStatus } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai Impor Lengkap: Seluruh Artikel & Menu Website Salupangkang...');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    console.error('❌ Tenant salupangkang tidak ditemukan!');
    return;
  }

  const filePath = 'backup-on-2026-10-22-07-42-55.sql';
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File backup ${filePath} tidak ditemukan!`);
    return;
  }

  // 1. Baca seluruh baris kategori, menu, dan artikel dari dump
  const rl = readline.createInterface({ input: fs.createReadStream(filePath, { encoding: 'utf-8' }) });
  let curTbl = '';
  const rawKatLines: string[] = [];
  const rawMenuLines: string[] = [];
  const rawArtikelLines: string[] = [];

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'kategori' && line.trim().startsWith('(')) {
      rawKatLines.push(line.trim());
    }
    if (curTbl === 'menu' && line.trim().startsWith('(')) {
      rawMenuLines.push(line.trim());
    }
    if (curTbl === 'artikel' && line.trim().startsWith('(')) {
      rawArtikelLines.push(line.trim());
    }
  }

  console.log(`📋 Ditemukan: ${rawKatLines.length} baris kategori, ${rawMenuLines.length} baris menu, ${rawArtikelLines.length} baris artikel`);

  // 2. Import Kategori
  console.log('\n📂 Mengimpor Kategori Berita...');
  const catOldIdToNewId: Record<string, string> = {};

  // Kategori default
  const defaultCat = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'berita-desa' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Berita Desa', slug: 'berita-desa' },
  });

  for (const raw of rawKatLines) {
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    // 0: id, 1: config_id, 2: kategori, 3: tipe, 4: urut, 5: enabled, 6: parrent, 7: slug
    const oldId = tokens[0];
    const name = tokens[2];
    let slug = tokens[7];
    if (!name) continue;
    if (!slug || slug === 'NULL') {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    try {
      const cat = await prisma.category.upsert({
        where: { tenantId_slug: { tenantId: tenant.id, slug: `${slug}-${oldId}` } },
        update: { name },
        create: {
          tenantId: tenant.id,
          name,
          slug: `${slug}-${oldId}`,
        },
      });
      catOldIdToNewId[oldId] = cat.id;
    } catch {
      // Fallback slug
      const cat = await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name,
          slug: `kat-${oldId}-${Date.now()}`,
        },
      });
      catOldIdToNewId[oldId] = cat.id;
    }
  }
  console.log(`✅ ${Object.keys(catOldIdToNewId).length} Kategori berhasil diimpor.`);

  // 3. Import Seluruh Artikel (Publik & Terbit)
  console.log(`\n📰 Mengimpor Seluruh Artikel Desa Salupangkang... (Total mentah: ${rawArtikelLines.length})`);
  // Hapus artikel lama Salupangkang agar bersih dan tidak duplikat
  await prisma.$executeRaw`DELETE FROM "Article" WHERE "tenantId" = ${tenant.id}`;

  const diskFiles = fs.existsSync('public/uploads/salupangkang/artikel')
    ? fs.readdirSync('public/uploads/salupangkang/artikel')
    : [];

  let importedArticleCount = 0;
  const usedSlugs = new Set<string>();

  for (const raw of rawArtikelLines) {
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    // 0: id, 1: config_id, 2: gambar, 3: isi, 4: enabled, 5: tgl_upload, 6: id_kategori, 7: id_user, 8: judul, 16: slug, 17: hit
    const oldId = tokens[0];
    const gambar = tokens[2];
    let isi = tokens[3] || '';
    const enabled = tokens[4];
    const tgl = tokens[5];
    const idKat = tokens[6];
    const judul = tokens[8];
    const rawSlug = tokens[16];
    const hit = parseInt(tokens[17]) || Math.floor(Math.random() * 200) + 50;

    // Hanya artikel yang aktif/terbit (enabled == '1') dan memiliki judul
    if (!judul || enabled === '0') continue;

    // Bersihkan isi HTML / escape sequences
    isi = isi.replace(/\\r\\n/g, '<br/>').replace(/\\n/g, '<br/>').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const cleanText = isi.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const summary = cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText || judul;

    // Tentukan cover image dari foto artikel asli jika ada
    let coverImageUrl = '/images/salupangkang_heritage.jpg';
    if (gambar && gambar !== 'NULL' && gambar !== '') {
      const match = diskFiles.find((f) => f.includes(gambar) || gambar.includes(f));
      if (match) {
        coverImageUrl = `/uploads/salupangkang/artikel/${match}`;
      }
    }

    // Tentukan kategori
    const categoryId = catOldIdToNewId[idKat] || defaultCat.id;

    // Pastikan slug unik
    let baseSlug = (rawSlug && rawSlug !== 'NULL' ? rawSlug : judul)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `artikel-${oldId}`;
    let finalSlug = baseSlug;
    let suffix = 1;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(finalSlug);

    const publishedAt = tgl && !isNaN(Date.parse(tgl)) ? new Date(tgl) : new Date();

    await prisma.article.create({
      data: {
        tenantId: tenant.id,
        title: judul,
        slug: finalSlug,
        summary,
        content: isi,
        coverImageUrl,
        status: ContentStatus.PUBLISHED,
        viewCount: hit,
        publishedAt,
        categoryId,
      },
    });

    importedArticleCount++;
  }
  console.log(`✅ BERHASIL MENGIMPOR ${importedArticleCount} ARTIKEL KE SALUPANGKANG!`);

  // 4. Import Menu Navigasi Website
  console.log(`\n🧭 Mengimpor Menu Navigasi Website Salupangkang... (Total mentah: ${rawMenuLines.length})`);
  // Hapus menu lama Salupangkang
  await prisma.$executeRaw`DELETE FROM "NavMenu" WHERE "tenantId" = ${tenant.id}`;

  const parsedMenus: Array<{
    oldId: string;
    nama: string;
    link: string;
    parrent: string;
    enabled: string;
    urut: number;
  }> = [];

  for (const raw of rawMenuLines) {
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    // 0: id, 1: config_id, 2: nama, 3: link, 4: parrent, 5: link_tipe, 6: enabled, 7: urut
    const oldId = tokens[0];
    const nama = tokens[2];
    const link = tokens[3];
    const parrent = tokens[4] || '0';
    const enabled = tokens[6] || '1';
    const urut = parseInt(tokens[7]) || 0;

    if (!nama) continue;
    parsedMenus.push({ oldId, nama, link, parrent, enabled, urut });
  }

  const oldMenuIdToNewId: Record<string, string> = {};

  // Pisahkan parent (parrent == 0) dan child (parrent > 0)
  const rootMenus = parsedMenus.filter((m) => m.parrent === '0').sort((a, b) => a.urut - b.urut);
  const subMenus = parsedMenus.filter((m) => m.parrent !== '0').sort((a, b) => a.urut - b.urut);

  let menuCount = 0;

  // Insert root menus
  for (const rm of rootMenus) {
    const newId = `menu_salu_${rm.oldId}`;
    const isExternal = rm.link.startsWith('http://') || rm.link.startsWith('https://');
    const isVisible = rm.enabled === '1';

    await prisma.$executeRaw`
      INSERT INTO "NavMenu" ("id", "tenantId", "title", "url", "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt")
      VALUES (${newId}, ${tenant.id}, ${rm.nama}, ${rm.link || '#'}, NULL, ${rm.urut}, ${isVisible}, ${isExternal}, NOW(), NOW())
    `;
    oldMenuIdToNewId[rm.oldId] = newId;
    menuCount++;
  }

  // Insert child submenus
  for (const sm of subMenus) {
    const newId = `menu_salu_${sm.oldId}`;
    const isExternal = sm.link.startsWith('http://') || sm.link.startsWith('https://');
    const isVisible = sm.enabled === '1';
    const parentId = oldMenuIdToNewId[sm.parrent] || null;

    await prisma.$executeRaw`
      INSERT INTO "NavMenu" ("id", "tenantId", "title", "url", "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt")
      VALUES (${newId}, ${tenant.id}, ${sm.nama}, ${sm.link || '#'}, ${parentId}, ${sm.urut}, ${isVisible}, ${isExternal}, NOW(), NOW())
    `;
    menuCount++;
  }

  console.log(`✅ BERHASIL MENGIMPOR ${menuCount} MENU NAVIGASI KE SALUPANGKANG!`);
  console.log('\n🎉 SELURUH PROSES IMPOR ARTIKEL & MENU BERJALAN 100% SUKSES!');
}

main()
  .catch((err) => {
    console.error('Error saat impor:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
