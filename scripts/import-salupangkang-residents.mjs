import fs from 'fs';
import { PrismaClient } from '../lib/prisma-client-v3/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMULAI IMPORT DATA APARATUR SALUPANGKANG DARI BACKUP SQL ===\n');

  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf8');

  // 1. Ambil tenant Salupangkang
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    throw new Error('Tenant salupangkang tidak ditemukan di database PostgreSQL!');
  }
  console.log(`Ditemukan Tenant: ${tenant.namaDesa} (ID: ${tenant.id})`);

  // 2. Parse ref_jabatan
  const jabatanMap = new Map();
  const jabatanInserts = content.match(/INSERT INTO `ref_jabatan`[^;]+;/gi) || [];
  for (const ins of jabatanInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const parts = clean.split('\t').map(s => s.trim().replace(/^,/, '').trim().replace(/,$/, '').replace(/^'|'$/g, ''));
      const id = parseInt(parts[0], 10);
      const nama = parts[2];
      if (id && nama) jabatanMap.set(id, nama);
    }
  }

  // 3. Parse cluster desa (dusun, rw, rt)
  const clusterMap = new Map();
  const clusterInserts = content.match(/INSERT INTO `tweb_wil_clusterdesa`[^;]+;/gi) || [];
  for (const ins of clusterInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const parts = clean.split('\t').map(s => s.trim().replace(/^,/, '').trim().replace(/,$/, '').replace(/^'|'$/g, ''));
      const id = parseInt(parts[0], 10);
      const rt = parts[2];
      const rw = parts[3];
      const dusun = parts[4];
      if (id) clusterMap.set(id, { dusun, rw, rt });
    }
  }

  // 4. Parse tweb_keluarga (no_kk)
  const keluargaMap = new Map();
  const keluargaInserts = content.match(/INSERT INTO `tweb_keluarga`[^;]+;/gi) || [];
  for (const ins of keluargaInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const parts = clean.split('\t').map(s => s.trim().replace(/^,/, '').trim().replace(/,$/, '').replace(/^'|'$/g, ''));
      const id = parseInt(parts[0], 10);
      const noKk = parts[2];
      const alamat = parts[7];
      const idCluster = parts[8] ? parseInt(parts[8], 10) : null;
      if (id && noKk) keluargaMap.set(id, { noKk, alamat, idCluster });
    }
  }

  // 5. Parse tweb_penduduk map
  const pendudukById = new Map();
  const pendudukByNik = new Map();
  const pendudukInserts = content.match(/INSERT INTO `tweb_penduduk`[^;]+;/gi) || [];
  for (const ins of pendudukInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const cols = clean.split('\t').map(s => {
        let v = s.trim().replace(/^,/, '').trim().replace(/,$/, '').trim();
        if (v === 'NULL') return null;
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
        return v;
      });

      const id = parseInt(cols[0], 10);
      const nama = cols[2];
      const nik = cols[3];
      const idKk = cols[4] ? parseInt(cols[4], 10) : null;
      const sex = cols[8];
      const tempatLahir = cols[9];
      const tglLahir = cols[10];
      const agamaId = cols[11];
      const pendidikanId = cols[12];
      const pekerjaanId = cols[14];
      const statusKawin = cols[15];
      const foto = cols[23];
      const idCluster = cols[25] ? parseInt(cols[25], 10) : null;
      const alamatSekarang = cols[28];
      const telepon = cols[39];

      const pData = {
        id,
        nama,
        nik,
        idKk,
        sex: sex === '1' ? 'L' : 'P',
        tempatLahir,
        tglLahir,
        agamaId,
        pendidikanId,
        pekerjaanId,
        statusKawin,
        foto,
        idCluster,
        alamatSekarang,
        telepon
      };
      if (id) pendudukById.set(id, pData);
      if (nik) pendudukByNik.set(nik, pData);
    }
  }

  // 6. Parse tweb_desa_pamong
  const pamongList = [];
  const pamongInserts = content.match(/INSERT INTO `tweb_desa_pamong`[^;]+;/gi) || [];
  for (const ins of pamongInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const cols = clean.split('\t').map(s => {
        let v = s.trim().replace(/^,/, '').trim().replace(/,$/, '').trim();
        if (v === 'NULL') return null;
        if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
        return v;
      });

      const pamongId = parseInt(cols[0], 10);
      const pamongNama = cols[2];
      const pamongNip = cols[5];
      const pamongNik = cols[8];
      const pamongStatus = parseInt(cols[9], 10);
      const pamongFoto = cols[12];
      const idPend = cols[13] ? parseInt(cols[13], 10) : null;
      const tempatLahir = cols[14];
      const tglLahir = cols[15];
      const sex = cols[16];
      const noSk = cols[19];
      const tglSk = cols[20];
      const urut = cols[22] ? parseInt(cols[22], 10) : 99;
      const niap = cols[23];
      const jabatanId = cols[34] ? parseInt(cols[34], 10) : null;
      const jabatanNama = jabatanId ? jabatanMap.get(jabatanId) : null;

      // Filter hanya yang aktif
      if (pamongStatus !== 1) continue;

      let pend = null;
      if (idPend && pendudukById.has(idPend)) {
        pend = pendudukById.get(idPend);
      } else if (pamongNik && pendudukByNik.has(pamongNik)) {
        pend = pendudukByNik.get(pamongNik);
      }

      let noKk = null;
      let dusun = null;
      let rt = '001';
      let rw = '001';
      let alamat = null;

      if (pend) {
        if (pend.idKk && keluargaMap.has(pend.idKk)) {
          const k = keluargaMap.get(pend.idKk);
          noKk = k.noKk;
          alamat = k.alamat || pend.alamatSekarang;
          if (k.idCluster && clusterMap.has(k.idCluster)) {
            const c = clusterMap.get(k.idCluster);
            dusun = c.dusun;
            rt = c.rt;
            rw = c.rw;
          }
        }
        if (!dusun && pend.idCluster && clusterMap.has(pend.idCluster)) {
          const c = clusterMap.get(pend.idCluster);
          dusun = c.dusun;
          rt = c.rt;
          rw = c.rw;
        }
      }

      const finalNama = pamongNama || (pend ? pend.nama : 'Aparatur Desa');
      const finalNik = (pend ? pend.nik : pamongNik) || `760604${String(Date.now()).slice(-10)}`;
      const finalTempatLahir = (pend ? pend.tempatLahir : tempatLahir) || 'Salupangkang';
      const finalTglLahir = (pend ? pend.tglLahir : tglLahir) || '1985-01-01';
      const finalSex = (pend ? pend.sex : (sex === '1' ? 'L' : 'P')) || 'L';
      const rawFoto = pamongFoto || (pend ? pend.foto : null);
      const finalTelepon = pend ? pend.telepon : null;

      // Resolusi path foto
      let finalFotoUrl = null;
      if (rawFoto) {
        if (fs.existsSync(`public/desa/upload/user_pict/${rawFoto}`)) {
          finalFotoUrl = `/desa/upload/user_pict/${rawFoto}`;
        } else if (fs.existsSync(`public/uploads/salupangkang/user_pict/${rawFoto}`)) {
          finalFotoUrl = `/uploads/salupangkang/user_pict/${rawFoto}`;
        } else {
          finalFotoUrl = `/desa/upload/user_pict/${rawFoto}`;
        }
      }

      pamongList.push({
        pamongId,
        nama: finalNama.replace(/\s+/g, ' ').trim(),
        nik: finalNik.trim(),
        noKk: (noKk ? noKk.trim() : `${finalNik.slice(0, 6)}0000000000`),
        tempatLahir: finalTempatLahir,
        tanggalLahir: new Date(finalTglLahir),
        jenisKelamin: finalSex,
        jabatan: (jabatanNama || 'Perangkat Desa').trim(),
        nip: pamongNip && pamongNip !== '0' && pamongNip !== '-' ? pamongNip.trim() : (niap && niap !== '0' ? niap.trim() : null),
        noSk: noSk || null,
        tglSk: tglSk ? new Date(tglSk) : null,
        urut,
        fotoUrl: finalFotoUrl,
        dusun: dusun || 'Dusun Krajan',
        rt: rt && rt !== '0' && rt !== '-' ? rt : '001',
        rw: rw && rw !== '0' && rw !== '-' ? rw : '001',
        alamat: alamat || 'Desa Salupangkang',
        telepon: finalTelepon,
      });
    }
  }

  console.log(`Ditemukan ${pamongList.length} aparatur aktif dari backup.`);

  // 7. Bersihkan data fiktif Salupangkang
  console.log('\n--- MENGHAPUS DATA FIKTIF KHUSUS DESA SALUPANGKANG ---');

  // Putuskan referensi relasi
  await prisma.villageOfficial.updateMany({
    where: { tenantId: tenant.id },
    data: { residentId: null },
  });
  await prisma.merchant.updateMany({
    where: { tenantId: tenant.id },
    data: { residentId: null },
  });
  await prisma.article.updateMany({
    where: { tenantId: tenant.id },
    data: { authorResidentId: null },
  });

  // Hapus semua resident Salupangkang
  const deletedResidents = await prisma.resident.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log(`Berhasil menghapus ${deletedResidents.count} data penduduk lama Salupangkang.`);

  // Hapus semua villageOfficial lama Salupangkang
  const deletedOfficials = await prisma.villageOfficial.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log(`Berhasil mereset ${deletedOfficials.count} data pamong lama Salupangkang.`);

  // 8. Masukkan data aparatur asli ke tabel Resident dan tautkan ke VillageOfficial
  console.log('\n--- MENGIMPORT APARATUR ASLI KE RESIDENT & VILLAGE_OFFICIAL ---');

  // Urutkan berdasarkan nomor urut jabatan (1 = Kepala Desa, 2 = Sekdes, dst.)
  pamongList.sort((a, b) => a.urut - b.urut);

  // Hindari duplikasi NIK jika ada nama aparatur tercatat ganda
  const processedNiks = new Set();
  let insertedCount = 0;

  for (const p of pamongList) {
    if (processedNiks.has(p.nik)) {
      console.log(`Lewati duplikat NIK: ${p.nik} (${p.nama})`);
      continue;
    }
    processedNiks.add(p.nik);

    // 1. Buat Resident
    const resident = await prisma.resident.create({
      data: {
        tenantId: tenant.id,
        nik: p.nik,
        noKk: p.noKk,
        nama: p.nama,
        jenisKelamin: p.jenisKelamin,
        tempatLahir: p.tempatLahir,
        tanggalLahir: p.tanggalLahir,
        agama: 'Islam',
        pendidikan: 'SLTA / Sederajat',
        pekerjaan: 'Perangkat Desa',
        statusKawin: 'Kawin',
        golonganDarah: 'O',
        hubunganKeluarga: p.urut === 1 ? 'Kepala Keluarga' : 'Warga',
        alamat: p.alamat,
        dusun: p.dusun,
        rt: p.rt,
        rw: p.rw,
        telepon: p.telepon,
        fotoUrl: p.fotoUrl,
        statusDasar: 'Hidup',
      },
    });

    // 2. Buat VillageOfficial yang tertaut resmi ke Resident
    await prisma.villageOfficial.create({
      data: {
        tenantId: tenant.id,
        residentId: resident.id,
        name: p.nama,
        position: p.jabatan,
        nip: p.nip,
        photoUrl: p.fotoUrl,
        orderIndex: p.urut,
        isActive: true,
      },
    });

    insertedCount++;
    console.log(`[${insertedCount}] Sukses: ${p.nama} (${p.jabatan}) - NIK: ${p.nik} - Dusun: ${p.dusun}`);
  }

  // Tautkan kembali artikel pertama Salupangkang ke Kepala Desa sebagai penulis resmi
  const kadesResident = await prisma.resident.findFirst({
    where: { tenantId: tenant.id, nama: { contains: 'Sapiil' } },
  });
  if (kadesResident) {
    await prisma.article.updateMany({
      where: { tenantId: tenant.id },
      data: { authorResidentId: kadesResident.id },
    });
    console.log(`\nArtikel Salupangkang ditautkan ke Kepala Desa (${kadesResident.nama}) sebagai penulis resmi.`);
  }

  console.log(`\n=== SELESAI: Berhasil mengimport ${insertedCount} Aparatur Asli Salupangkang ke Master Data Penduduk! ===`);
}

main()
  .catch((e) => {
    console.error('Error saat import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
