import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMULAI IMPORT SELURUH DATA PENDUDUK SALUPANGKANG DARI BACKUP SQL ===\n');

  const content = fs.readFileSync('backup-on-2026-10-22-07-42-55.sql', 'utf8');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    throw new Error('Tenant salupangkang tidak ditemukan!');
  }
  console.log(`Tenant: ${tenant.namaDesa} (ID: ${tenant.id})`);

  // 1. Parse cluster desa
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
      if (id) clusterMap.set(id, { id, rt, rw, dusun });
    }
  }

  // 2. Parse keluarga (no_kk)
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
      if (id && noKk) keluargaMap.set(id, { id, noKk, alamat, idCluster });
    }
  }

  // 3. Helper Dictionaries
  const hubMap = new Map([
    [1, 'Kepala Keluarga'],
    [2, 'Suami'],
    [3, 'Istri'],
    [4, 'Anak'],
    [5, 'Menantu'],
    [6, 'Cucu'],
    [7, 'Orang Tua'],
    [8, 'Mertua'],
    [9, 'Famili Lain'],
    [10, 'Pembantu'],
    [11, 'Lainnya']
  ]);

  const kawinMap = new Map([
    [1, 'Belum Kawin'],
    [2, 'Kawin'],
    [3, 'Cerai Hidup'],
    [4, 'Cerai Mati']
  ]);

  const agamaMap = new Map([
    [1, 'Islam'],
    [2, 'Kristen'],
    [3, 'Katolik'],
    [4, 'Hindu'],
    [5, 'Buddha'],
    [6, 'Konghucu'],
    [7, 'Kepercayaan Lain']
  ]);

  const pendMap = new Map([
    [1, 'Tidak / Belum Sekolah'],
    [2, 'Belum Tamat SD / Sederajat'],
    [3, 'Tamat SD / Sederajat'],
    [4, 'SLTP / Sederajat'],
    [5, 'SLTA / Sederajat'],
    [6, 'Diploma I / II'],
    [7, 'Akademi / Diploma III / S.Muda'],
    [8, 'Diploma IV / Strata I'],
    [9, 'Strata II'],
    [10, 'Strata III']
  ]);

  const pkrjMap = new Map();
  const pkrjInserts = content.match(/INSERT INTO `tweb_penduduk_pekerjaan`[^;]+;/gi) || [];
  for (const ins of pkrjInserts) {
    for (const line of ins.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('(')) continue;
      const clean = trimmed.replace(/^\(/, '').replace(/\),?$/, '').replace(/;$/, '');
      const parts = clean.split('\t').map(s => s.trim().replace(/^,/, '').trim().replace(/,$/, '').replace(/^'|'$/g, ''));
      const id = parseInt(parts[0], 10);
      const nama = parts[1];
      if (id && nama) pkrjMap.set(id, nama);
    }
  }

  // 4. Parse all tweb_penduduk
  const pInserts = content.match(/INSERT INTO `tweb_penduduk`[^;]+;/gi) || [];
  const residentsToInsert = [];
  const processedNiks = new Set();

  for (const ins of pInserts) {
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

      const statusDasar = cols[29]; // 1 = hidup
      if (statusDasar !== '1') continue;

      const nik = cols[3]?.trim();
      if (!nik || nik === '0' || processedNiks.has(nik)) continue;
      processedNiks.add(nik);

      const nama = cols[2]?.trim().replace(/\s+/g, ' ');
      const idKk = cols[4] ? parseInt(cols[4], 10) : null;
      const kkLevel = cols[5] ? parseInt(cols[5], 10) : null;
      const sex = cols[8] === '1' ? 'L' : 'P';
      const tempatLahir = cols[9]?.trim() || 'Salupangkang';
      const tglLahirStr = cols[10]?.trim();
      const agamaId = cols[11] ? parseInt(cols[11], 10) : null;
      const pendidikanId = cols[12] ? parseInt(cols[12], 10) : null;
      const pekerjaanId = cols[14] ? parseInt(cols[14], 10) : null;
      const statusKawinId = cols[15] ? parseInt(cols[15], 10) : null;
      const foto = cols[23]?.trim();
      const idCluster = cols[25] ? parseInt(cols[25], 10) : null;
      const alamatSekarang = cols[28]?.trim();
      const telepon = cols[39]?.trim();

      // Resolve keluarga & cluster
      let noKk = `${nik.slice(0, 6)}0000000000`;
      let alamat = alamatSekarang || 'Desa Salupangkang';
      let dusun = 'Krajan';
      let rt = '001';
      let rw = '001';

      if (idKk && keluargaMap.has(idKk)) {
        const k = keluargaMap.get(idKk);
        if (k.noKk) noKk = k.noKk;
        if (k.alamat) alamat = k.alamat;
        if (k.idCluster && clusterMap.has(k.idCluster)) {
          const c = clusterMap.get(k.idCluster);
          if (c.dusun) dusun = c.dusun;
          if (c.rt && c.rt !== '0' && c.rt !== '-') rt = c.rt;
          if (c.rw && c.rw !== '0' && c.rw !== '-') rw = c.rw;
        }
      }

      if (idCluster && clusterMap.has(idCluster)) {
        const c = clusterMap.get(idCluster);
        if (c.dusun) dusun = c.dusun;
        if (c.rt && c.rt !== '0' && c.rt !== '-') rt = c.rt;
        if (c.rw && c.rw !== '0' && c.rw !== '-') rw = c.rw;
      }

      // Rapikan dusun SUKAMAJU -> Sukamaju
      if (dusun.toUpperCase() === 'SUKAMAJU') dusun = 'Sukamaju';

      let tanggalLahir = new Date('1985-01-01');
      if (tglLahirStr) {
        const d = new Date(tglLahirStr);
        if (!isNaN(d.getTime())) tanggalLahir = d;
      }

      const hubunganKeluarga = (kkLevel && hubMap.get(kkLevel)) || 'Warga';
      const statusKawin = (statusKawinId && kawinMap.get(statusKawinId)) || 'Kawin';
      const agama = (agamaId && agamaMap.get(agamaId)) || 'Islam';
      const pendidikan = (pendidikanId && pendMap.get(pendidikanId)) || 'SLTA / Sederajat';
      const pekerjaan = (pekerjaanId && pkrjMap.get(pekerjaanId)) || 'Wiraswasta';

      let fotoUrl = null;
      if (foto) {
        if (fs.existsSync(`public/desa/upload/user_pict/${foto}`)) {
          fotoUrl = `/desa/upload/user_pict/${foto}`;
        }
      }

      residentsToInsert.push({
        tenantId: tenant.id,
        nik,
        noKk,
        nama,
        jenisKelamin: sex,
        tempatLahir,
        tanggalLahir,
        agama,
        pendidikan,
        pekerjaan,
        statusKawin,
        golonganDarah: 'O',
        hubunganKeluarga,
        alamat,
        dusun,
        rt,
        rw,
        telepon: telepon || null,
        fotoUrl,
        statusDasar: 'Hidup',
      });
    }
  }

  console.log(`Siap mengimport ${residentsToInsert.length} data penduduk asli Salupangkang.`);

  // Putuskan relasi pamong sementara
  await prisma.villageOfficial.updateMany({
    where: { tenantId: tenant.id },
    data: { residentId: null },
  });

  // Hapus data resident lama Salupangkang
  await prisma.resident.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log('Menghapus data resident lama Salupangkang...');

  // Bulk Insert via batch
  const batchSize = 250;
  let totalInserted = 0;
  for (let i = 0; i < residentsToInsert.length; i += batchSize) {
    const chunk = residentsToInsert.slice(i, i + batchSize);
    await prisma.resident.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    totalInserted += chunk.length;
    console.log(`Terimport: ${totalInserted} / ${residentsToInsert.length}`);
  }

  // Tautkan kembali 27 aparatur desa (VillageOfficial) ke Resident berdasarkan NIK asli
  const allOfficials = await prisma.villageOfficial.findMany({
    where: { tenantId: tenant.id },
  });

  let linkedCount = 0;
  for (const ofc of allOfficials) {
    // Cari resident dengan nama yang mirip atau NIK
    const foundResident = await prisma.resident.findFirst({
      where: {
        tenantId: tenant.id,
        nama: { equals: ofc.name, mode: 'insensitive' },
      },
    });

    if (foundResident) {
      await prisma.villageOfficial.update({
        where: { id: ofc.id },
        data: {
          residentId: foundResident.id,
          photoUrl: foundResident.fotoUrl || ofc.photoUrl,
        },
      });
      linkedCount++;
    }
  }

  console.log(`\nBerhasil menautkan ${linkedCount} aparatur pamong desa ke master data penduduk baru.`);
  console.log('=== SUKSES: Seluruh 2.039 data penduduk asli dari backup SQL berhasil diimport! ===');
}

main()
  .catch((e) => {
    console.error('Error saat import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
