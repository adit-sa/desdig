import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- MEMULAI IMPORT DATA PEMBANGUNAN DARI SQL BACKUP ---');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    throw new Error('Tenant salupangkang tidak ditemukan');
  }

  const sqlFilePath = path.join(process.cwd(), 'backup-on-2026-10-22-07-42-55.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

  // 1. Ekstrak INSERT INTO `pembangunan`
  const pembangunanMatch = sqlContent.match(/INSERT INTO `pembangunan`[^;]+;/);
  if (!pembangunanMatch) {
    throw new Error('Data INSERT INTO pembangunan tidak ditemukan dalam file SQL');
  }

  console.log('Menemukan blok INSERT INTO pembangunan');
  const insertQuery = pembangunanMatch[0];

  // Map ID pembangunan lama (int) ke CUID / ID baru
  const idMap = new Map<number, string>();

  // Parse values: (id, config_id, id_lokasi, sumber_dana, judul, slug, keterangan, lokasi, lat, lng, volume, tahun_anggaran, pelaksana_kegiatan, status, created_at, updated_at, foto, anggaran, ...)
  // Regex match individual rows: \((.+?)\)(?:,|;)
  // Tapi karena di keterangan bisa ada koma dan string ber-escape, mari kita parse secara teliti
  const valuesRegex = /\(([\s\S]+?)\)(?:,|;)/g;
  let match;
  let importedCount = 0;

  // Kita buang header INSERT INTO `pembangunan` (...) VALUES
  const valuesStartIndex = insertQuery.indexOf('VALUES');
  const rawValues = insertQuery.substring(valuesStartIndex + 6);

  // Helper untuk parse baris SQL value
  function parseSqlRow(rowStr: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let isEscaped = false;

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];

      if (isEscaped) {
        current += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        current += char;
        continue;
      }

      if ((char === "'" || char === '"') && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }

      if (char === quoteChar && inQuotes) {
        inQuotes = false;
        continue;
      }

      if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }
    fields.push(current.trim());
    return fields;
  }

  while ((match = valuesRegex.exec(rawValues)) !== null) {
    const rowStr = match[1];
    const fields = parseSqlRow(rowStr);

    if (fields.length < 18) continue;

    const oldId = parseInt(fields[0], 10);
    // fields[1] = config_id
    // fields[2] = id_lokasi
    const sumberDanaRaw = fields[3].replace(/\\"/g, '"');
    let sumberDana = 'Dana Desa';
    try {
      const parsed = JSON.parse(sumberDanaRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sumberDana = parsed.join(', ');
      }
    } catch {
      sumberDana = sumberDanaRaw.replace(/^'|'$/g, '');
    }

    const clean = (val: string) => {
      if (!val || val === 'NULL') return '';
      return val.replace(/\\r\\n/g, '\n').replace(/\\'/g, "'").replace(/^'|'$/g, '').trim();
    };

    const judul = clean(fields[4]);
    const slug = clean(fields[5]) || `pembangunan-${oldId}`;
    const keterangan = clean(fields[6]);
    const lokasi = clean(fields[7]);
    // fields[8] = lat, fields[9] = lng
    const volume = clean(fields[10]);
    const tahunAnggaran = parseInt(clean(fields[11]), 10) || 2024;
    const pelaksanaKegiatan = clean(fields[12]);
    const statusVal = parseInt(fields[13], 10);
    const createdAtStr = clean(fields[14]);
    const updatedAtStr = clean(fields[15]);
    const foto = clean(fields[16]);
    const anggaranBig = BigInt(fields[17] || '0');
    const manfaat = fields[24] ? clean(fields[24]) : '';
    const waktu = fields[25] ? clean(fields[25]) : '30';
    const sifatProyek = fields[27] ? clean(fields[27]) : 'BARU';

    const newId = `dev_proj_${tenant.id}_${oldId}`;
    idMap.set(oldId, newId);

    // Cek apakah sudah ada
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM "DevelopmentProject"
      WHERE "tenantId" = ${tenant.id} AND "slug" = ${slug}
    `;

    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
    const updatedAt = updatedAtStr ? new Date(updatedAtStr) : new Date();

    if (existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE "DevelopmentProject"
        SET "judul" = ${judul},
            "keterangan" = ${keterangan},
            "lokasi" = ${lokasi},
            "tahunAnggaran" = ${tahunAnggaran},
            "anggaran" = ${anggaranBig},
            "volume" = ${volume},
            "pelaksanaKegiatan" = ${pelaksanaKegiatan},
            "sumberDana" = ${sumberDana},
            "manfaat" = ${manfaat},
            "waktu" = ${waktu},
            "sifatProyek" = ${sifatProyek},
            "status" = ${statusVal === 1 ? 'Selesai' : 'Proses'},
            "progressPersen" = 100,
            "foto" = ${foto ? `https://salupangkang.desa.id/desa/upload/pembangunan/${foto}` : null},
            "updatedAt" = ${updatedAt}
        WHERE id = ${existing[0].id}
      `;
      idMap.set(oldId, existing[0].id);
    } else {
      await prisma.$executeRaw`
        INSERT INTO "DevelopmentProject" (
          "id", "tenantId", "judul", "slug", "keterangan", "lokasi", "tahunAnggaran", "anggaran",
          "volume", "pelaksanaKegiatan", "sumberDana", "manfaat", "waktu", "sifatProyek", "status",
          "progressPersen", "foto", "createdAt", "updatedAt"
        ) VALUES (
          ${newId}, ${tenant.id}, ${judul}, ${slug}, ${keterangan}, ${lokasi}, ${tahunAnggaran}, ${anggaranBig},
          ${volume}, ${pelaksanaKegiatan}, ${sumberDana}, ${manfaat}, ${waktu}, ${sifatProyek}, 'Selesai',
          100, ${foto ? `https://salupangkang.desa.id/desa/upload/pembangunan/${foto}` : null}, ${createdAt}, ${updatedAt}
        )
      `;
    }

    importedCount++;
  }

  console.log(`Berhasil mengimpor ${importedCount} proyek pembangunan!`);

  // 2. Ekstrak INSERT INTO `pembangunan_ref_dokumentasi`
  const docMatch = sqlContent.match(/INSERT INTO `pembangunan_ref_dokumentasi`[^;]+;/);
  if (docMatch) {
    console.log('Menemukan blok INSERT INTO pembangunan_ref_dokumentasi');
    const docQuery = docMatch[0];
    const docValuesIndex = docQuery.indexOf('VALUES');
    const docRawValues = docQuery.substring(docValuesIndex + 6);

    let docCount = 0;
    while ((match = valuesRegex.exec(docRawValues)) !== null) {
      const rowStr = match[1];
      const fields = parseSqlRow(rowStr);

      if (fields.length < 6) continue;

      const oldDocId = parseInt(fields[0], 10);
      const oldPembangunanId = parseInt(fields[2], 10);
      const clean = (val: string) => {
        if (!val || val === 'NULL') return '';
        return val.replace(/\\'/g, "'").replace(/^'|'$/g, '').trim();
      };

      const gambar = clean(fields[3]);
      const persentase = clean(fields[4]) || '100%';
      const keterangan = clean(fields[5]);
      const createdAtStr = clean(fields[6]);

      const targetProjectId = idMap.get(oldPembangunanId);
      if (!targetProjectId) continue;

      const docId = `doc_proj_${oldDocId}_${oldPembangunanId}`;
      const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

      const existingDoc = await prisma.$queryRaw<any[]>`
        SELECT id FROM "DevelopmentDocumentation" WHERE id = ${docId}
      `;

      const fullImageUrl = gambar ? `https://salupangkang.desa.id/desa/upload/pembangunan/${gambar}` : null;

      if (existingDoc.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO "DevelopmentDocumentation" ("id", "projectId", "persentase", "keterangan", "gambar", "createdAt", "updatedAt")
          VALUES (${docId}, ${targetProjectId}, ${persentase}, ${keterangan}, ${fullImageUrl}, ${createdAt}, ${createdAt})
        `;
        docCount++;
      }
    }
    console.log(`Berhasil mengimpor ${docCount} foto dokumentasi progress pembangunan!`);
  }

  console.log('--- SELESAI IMPORT DATA PEMBANGUNAN ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
