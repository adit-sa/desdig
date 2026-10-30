import { prisma } from '../lib/prisma';
import { DAFTAR_PENDUDUK } from '../lib/mock-data';

async function seedResidents() {
  console.log('👥 Memulai inisialisasi data master kependudukan...');

  const tenants = await prisma.tenant.findMany();
  if (tenants.length === 0) {
    console.log('Tidak ada tenant ditemukan.');
    return;
  }

  for (const tenant of tenants) {
    console.log(`Mengisi data penduduk untuk Desa ${tenant.namaDesa} (${tenant.slug})...`);

    // Cari penduduk mock yang cocok dengan tenant ini atau generate data penduduk berkualitas
    const tenantMockPenduduk = DAFTAR_PENDUDUK.filter(
      (p) => p.tenant_id === tenant.slug || p.tenant_id === tenant.id
    );

    const sourcePenduduk =
      tenantMockPenduduk.length > 0 ? tenantMockPenduduk : DAFTAR_PENDUDUK;

    for (let i = 0; i < sourcePenduduk.length; i++) {
      const p = sourcePenduduk[i];
      // Generate unique NIK per tenant jika fallback
      const nik =
        tenantMockPenduduk.length > 0
          ? p.nik
          : `${tenant.kodeDesa ? tenant.kodeDesa.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : '760601'}${p.nik.slice(6)}`;

      await prisma.resident.upsert({
        where: {
          tenantId_nik: {
            tenantId: tenant.id,
            nik,
          },
        },
        update: {
          nama: p.nama,
          noKk: p.no_kk,
          jenisKelamin: p.jenis_kelamin,
          tempatLahir: p.tempat_lahir,
          tanggalLahir: p.tanggal_lahir ? new Date(p.tanggal_lahir) : null,
          agama: p.agama,
          pendidikan: p.pendidikan,
          pekerjaan: p.pekerjaan,
          statusKawin: p.status_kawin,
          golonganDarah: p.golongan_darah,
          hubunganKeluarga: p.hubungan_keluarga,
          alamat: p.alamat,
          dusun: p.dusun,
          rt: p.rt,
          rw: p.rw,
          statusDasar: p.status_dasar || 'Hidup',
        },
        create: {
          tenantId: tenant.id,
          nik,
          noKk: p.no_kk,
          nama: p.nama,
          jenisKelamin: p.jenis_kelamin,
          tempatLahir: p.tempat_lahir,
          tanggalLahir: p.tanggal_lahir ? new Date(p.tanggal_lahir) : null,
          agama: p.agama,
          pendidikan: p.pendidikan,
          pekerjaan: p.pekerjaan,
          statusKawin: p.status_kawin,
          golonganDarah: p.golongan_darah,
          hubunganKeluarga: p.hubungan_keluarga,
          alamat: p.alamat,
          dusun: p.dusun,
          rt: p.rt,
          rw: p.rw,
          statusDasar: p.status_dasar || 'Hidup',
        },
      });
    }

    // Sambungkan aparatur desa yang namanya cocok dengan penduduk
    const officials = await prisma.villageOfficial.findMany({
      where: { tenantId: tenant.id },
    });
    const residents = await prisma.resident.findMany({
      where: { tenantId: tenant.id },
    });

    for (const ofc of officials) {
      // Cari nama penduduk yang paling mendekati nama aparatur (tanpa gelar)
      const cleanOfcName = ofc.name
        .replace(/^(H\.|Hj\.|Drs\.|Ir\.|Dr\.)\s*/i, '')
        .replace(/,\s*[A-Za-z\.\s]+$/i, '')
        .trim()
        .toLowerCase();

      const matchedResident = residents.find((r) => {
        const cleanResName = r.nama.trim().toLowerCase();
        return (
          cleanResName === cleanOfcName ||
          cleanResName.includes(cleanOfcName) ||
          cleanOfcName.includes(cleanResName)
        );
      });

      if (matchedResident) {
        await prisma.villageOfficial.update({
          where: { id: ofc.id },
          data: { residentId: matchedResident.id },
        });
        console.log(`  ✓ Pamong "${ofc.name}" tertaut ke Penduduk "${matchedResident.nama}" (NIK: ${matchedResident.nik})`);
      } else {
        // Buat penduduk baru untuk aparatur jika belum ada
        const newResident = await prisma.resident.create({
          data: {
            tenantId: tenant.id,
            nik: `${tenant.kodeDesa ? tenant.kodeDesa.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : '760601'}19${Math.floor(10000000 + Math.random() * 90000000)}`,
            noKk: `${tenant.kodeDesa ? tenant.kodeDesa.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : '760601'}2001010001`,
            nama: ofc.name,
            jenisKelamin: ofc.name.toLowerCase().includes('siti') || ofc.name.toLowerCase().includes('nur') ? 'P' : 'L',
            pekerjaan: 'Perangkat Desa',
            dusun: 'Dusun Kantor Balai Desa',
            alamat: `Kantor Desa ${tenant.namaDesa}`,
            statusDasar: 'Hidup',
          },
        });
        await prisma.villageOfficial.update({
          where: { id: ofc.id },
          data: { residentId: newResident.id },
        });
        console.log(`  + Penduduk otomatis dibuat untuk Pamong "${ofc.name}" (NIK: ${newResident.nik})`);
      }
    }

    // Sambungkan pelapak UMKM yang ada ke penduduk
    const merchants = await prisma.merchant.findMany({
      where: { tenantId: tenant.id },
    });
    for (const m of merchants) {
      let matchedResident = residents.find((r) =>
        r.nama.toLowerCase().includes(m.name.toLowerCase()) ||
        m.name.toLowerCase().includes(r.nama.toLowerCase())
      );

      if (!matchedResident) {
        matchedResident = await prisma.resident.create({
          data: {
            tenantId: tenant.id,
            nik: `${tenant.kodeDesa ? tenant.kodeDesa.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : '760601'}28${Math.floor(10000000 + Math.random() * 90000000)}`,
            noKk: `${tenant.kodeDesa ? tenant.kodeDesa.replace(/\D/g, '').padEnd(6, '0').slice(0, 6) : '760601'}2002020002`,
            nama: m.name,
            jenisKelamin: m.name.toLowerCase().includes('ibu') || m.name.toLowerCase().includes('fatimah') ? 'P' : 'L',
            pekerjaan: 'Wiraswasta / Pedagang',
            dusun: m.address || 'Dusun Pasar Desa',
            alamat: m.address || `Desa ${tenant.namaDesa}`,
            telepon: m.phone,
            statusDasar: 'Hidup',
          },
        });
      }

      await prisma.merchant.update({
        where: { id: m.id },
        data: { residentId: matchedResident.id },
      });
      console.log(`  ✓ Pelapak "${m.shopName}" (${m.name}) tertaut ke Penduduk "${matchedResident.nama}"`);
    }
  }

  console.log('✅ Inisialisasi data penduduk selesai!');
}

seedResidents()
  .catch((e) => {
    console.error('Error saat seed penduduk:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
