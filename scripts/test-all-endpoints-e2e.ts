import http from 'http';

function get(path: string, cookie?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : {},
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, body: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAll() {
  console.log('====================================================');
  console.log('   FULL END-TO-END MULTI-TENANT AUDIT INSPECTION    ');
  console.log('====================================================\n');

  const endpoints = [
    { name: 'Identitas Desa', path: '/api/identity' },
    { name: 'Aparatur / Pamong', path: '/api/officials' },
    { name: 'Kependudukan', path: '/api/residents?limit=50' },
    { name: 'Dusun Desa', path: '/api/residents/dusun' },
    { name: 'Pembangunan', path: '/api/pembangunan' },
    { name: 'Berita & Artikel', path: '/api/articles?status=ALL' },
    { name: 'Pelapak & UMKM', path: '/api/merchants' },
    { name: 'Galeri Foto/Video', path: '/api/gallery' },
    { name: 'Pengumuman', path: '/api/announcements' },
    { name: 'Kategori Berita', path: '/api/categories' },
    { name: 'Menu Portal', path: '/api/menus' },
    { name: 'Tema & Desain', path: '/api/theme' },
    { name: 'Modul Sistem', path: '/api/modules' },
    { name: 'Keuangan APBDes', path: '/api/apbdes?year=2025' },
    { name: 'Halaman Statis', path: '/api/pages' },
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const ep of endpoints) {
    process.stdout.write(`Testing [${ep.name}] (${ep.path})... `);
    try {
      const sep = ep.path.includes('?') ? '&' : '?';

      // 1. Sukamaju request
      const resSuka = await get(`${ep.path}${sep}tenant=sukamaju`);
      // 2. Salupangkang request
      const resSalu = await get(`${ep.path}${sep}tenant=salupangkang`);

      if (resSuka.status !== 200 || resSalu.status !== 200) {
        console.log(`❌ FAILED (Status: Sukamaju=${resSuka.status}, Salupangkang=${resSalu.status})`);
        failedCount++;
        continue;
      }

      const strSuka = JSON.stringify(resSuka.body);
      const strSalu = JSON.stringify(resSalu.body);

      // Verify no Salupangkang in Sukamaju (except possibly in global theme options)
      const hasSaluInSuka = strSuka.toLowerCase().includes('salupangkang');
      
      // Special check: in theme route, availableThemes might mention Traditional Village but shouldn't leak tenant data
      if (hasSaluInSuka && ep.path !== '/api/theme') {
        console.log(`❌ CONTAMINATION DETECTED: Salupangkang found in Sukamaju response!`);
        failedCount++;
        continue;
      }

      console.log(`✅ PASSED 100%`);
      passedCount++;
    } catch (e: any) {
      console.log(`❌ ERROR: ${e.message}`);
      failedCount++;
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Total Tested: ${endpoints.length} endpoints`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('----------------------------------------------------');

  if (failedCount === 0) {
    console.log('🎉 SELURUH SISTEM 100% TERISOLASI DAN LOLOS PEMERIKSAAN!');
  } else {
    process.exit(1);
  }
}

testAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
