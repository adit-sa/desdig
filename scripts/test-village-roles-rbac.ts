export { };
const BASE_URL = 'http://localhost:3000';

async function login(email: string, password: string, kodeDesa?: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, kodeDesa }),
  });
  const data = (await res.json()) as any;
  const setCookie = res.headers.get('set-cookie');
  let cookieHeader = '';
  if (setCookie) {
    const match = setCookie.match(/(?:desdig_auth_session|opensid_auth_session)=[^;]+/);
    if (match) cookieHeader = match[0];
  }
  return { status: res.status, data, cookie: cookieHeader };
}

async function runVillageRoleTests() {
  console.log('====================================================');
  console.log('   VILLAGE INTERNAL ROLES & PERMISSIONS RBAC TEST   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.log(`❌ [FAIL] ${title} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Login ketiga peran internal di Desa Salupangkang
  const adminLogin = await login('admin@salupangkang.desa.id', 'salupangkang123', '7606042009');
  assert(
    'Login Admin Utama Desa (VILLAGE_ADMIN)',
    adminLogin.status === 200 && adminLogin.data.user?.role === 'VILLAGE_ADMIN',
    `Status: ${adminLogin.status}, Role: ${adminLogin.data.user?.role}`
  );

  const editorLogin = await login('operator@salupangkang.desa.id', 'salupangkang123', '7606042009');
  assert(
    'Login Operator Desa (EDITOR)',
    editorLogin.status === 200 && editorLogin.data.user?.role === 'EDITOR',
    `Status: ${editorLogin.status}, Role: ${editorLogin.data.user?.role}`
  );

  const authorLogin = await login('penulis@salupangkang.desa.id', 'salupangkang123', '7606042009');
  assert(
    'Login Penulis Berita (AUTHOR)',
    authorLogin.status === 200 && authorLogin.data.user?.role === 'AUTHOR',
    `Status: ${authorLogin.status}, Role: ${authorLogin.data.user?.role}`
  );

  console.log('\n--- TEST A: Hak Akses Kelola Pengguna (/api/users) ---');
  // Admin Utama Desa BISA mengelola user
  const resAdminUsers = await fetch(`${BASE_URL}/api/users?tenant=salupangkang`, {
    headers: { cookie: adminLogin.cookie },
  });
  assert('Admin Utama Desa diizinkan akses /api/users (200)', resAdminUsers.status === 200, `Status: ${resAdminUsers.status}`);

  // Operator Desa DILARANG mengelola user (403)
  const resEditorUsers = await fetch(`${BASE_URL}/api/users?tenant=salupangkang`, {
    headers: { cookie: editorLogin.cookie },
  });
  assert('Operator Desa diblokir dari /api/users (403)', resEditorUsers.status === 403, `Status: ${resEditorUsers.status}`);

  // Penulis Berita DILARANG mengelola user (403)
  const resAuthorUsers = await fetch(`${BASE_URL}/api/users?tenant=salupangkang`, {
    headers: { cookie: authorLogin.cookie },
  });
  assert('Penulis Berita diblokir dari /api/users (403)', resAuthorUsers.status === 403, `Status: ${resAuthorUsers.status}`);

  console.log('\n--- TEST B: Hak Akses Kependudukan (/api/residents) ---');
  // Penulis Berita DILARANG menambah/mengubah data penduduk (403)
  const resAuthorRes = await fetch(`${BASE_URL}/api/residents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      nik: '7606049988770001',
      nama: 'Warga Uji Penulis',
    }),
  });
  assert('Penulis Berita diblokir dari input penduduk (403)', resAuthorRes.status === 403, `Status: ${resAuthorRes.status}`);

  // Operator Desa DIIZINKAN input penduduk
  const resEditorRes = await fetch(`${BASE_URL}/api/residents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: editorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      nik: `760604${Date.now().toString().slice(-10)}`,
      nama: 'Warga Hasil Input Operator',
    }),
  });
  assert('Operator Desa diizinkan input penduduk (201)', resEditorRes.status === 201, `Status: ${resEditorRes.status}`);

  console.log('\n--- TEST C: Hak Akses Keuangan APBDes (/api/apbdes) ---');
  // Penulis Berita DILARANG input APBDes (403)
  const resAuthorApbdes = await fetch(`${BASE_URL}/api/apbdes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      category: 'Pendapatan',
      accountCode: '4.1.99',
      accountName: 'Uji APBDes Penulis',
      budget: 10000000,
    }),
  });
  assert('Penulis Berita diblokir dari input APBDes (403)', resAuthorApbdes.status === 403, `Status: ${resAuthorApbdes.status}`);

  // Operator Desa DILARANG input APBDes (Khusus Admin Utama / Bendahara) (403)
  const resEditorApbdes = await fetch(`${BASE_URL}/api/apbdes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: editorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      category: 'Pendapatan',
      accountCode: '4.1.99',
      accountName: 'Uji APBDes Operator',
      budget: 10000000,
    }),
  });
  assert('Operator Desa diblokir dari input APBDes (403)', resEditorApbdes.status === 403, `Status: ${resEditorApbdes.status}`);

  console.log('\n--- TEST D: Hak Akses Penulisan Berita (/api/articles) ---');
  // Penulis Berita DIIZINKAN membuat artikel (201)
  const articleSlug = `artikel-penulis-${Date.now()}`;
  const resAuthorArticle = await fetch(`${BASE_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      title: 'Liputan Kegiatan Warga oleh Penulis Desa',
      slug: articleSlug,
      summary: 'Kabar aktual desa terkini',
      content: '<p>Laporan jurnalistik warga desa mandiri...</p>',
      status: 'PUBLISHED',
    }),
  });
  assert('Penulis Berita diizinkan membuat artikel (201)', resAuthorArticle.status === 201, `Status: ${resAuthorArticle.status}`);

  console.log('\n--- TEST E: Proteksi Pengaturan Sistem Desa (/api/theme) ---');
  // Penulis Berita DILARANG mengubah tema desa (403)
  const resAuthorTheme = await fetch(`${BASE_URL}/api/theme`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authorLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'salupangkang',
      themeId: 'traditional-village',
    }),
  });
  assert('Penulis Berita diblokir dari ganti tema desa (403)', resAuthorTheme.status === 403, `Status: ${resAuthorTheme.status}`);

  console.log('\n--- TEST F: Proteksi Halaman UI via Middleware (Redirect Guard) ---');
  // Penulis Berita membuka URL /admin/users -> Otomatis diarahkan kembali ke /admin (307 Redirect)
  const resAuthorPage = await fetch(`${BASE_URL}/admin/users?tenant=salupangkang`, {
    headers: { cookie: authorLogin.cookie },
    redirect: 'manual',
  });
  assert(
    'Penulis Berita dicegah membuka URL /admin/users (Redirect ke /admin)',
    resAuthorPage.status === 307 || resAuthorPage.status === 302,
    `Status: ${resAuthorPage.status}, Location: ${resAuthorPage.headers.get('location')}`
  );

  // Admin Utama Desa membuka URL /admin/users -> Diizinkan (200 OK)
  const resAdminPage = await fetch(`${BASE_URL}/admin/users?tenant=salupangkang`, {
    headers: { cookie: adminLogin.cookie },
    redirect: 'manual',
  });
  assert(
    'Admin Utama Desa diizinkan membuka URL /admin/users (200)',
    resAdminPage.status === 200,
    `Status: ${resAdminPage.status}`
  );

  console.log('\n----------------------------------------------------');
  console.log(`Total Pengujian: ${passed + failed}`);
  console.log(`Lolos          : ${passed}`);
  console.log(`Gagal          : ${failed}`);
  console.log('----------------------------------------------------');

  if (failed === 0) {
    console.log('🎉 SELURUH PERAN DESA (VILLAGE_ADMIN, EDITOR, AUTHOR) TERUJI DAN TERISOLASI 100%!');
  } else {
    process.exit(1);
  }
}

runVillageRoleTests().catch(console.error);
