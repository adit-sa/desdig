export {};
const BASE_URL = 'http://localhost:3000';

async function login(email: string, password: string, kodeDesa?: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, kodeDesa }),
  });
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  let cookieHeader = '';
  if (setCookie) {
    const match = setCookie.match(/(?:desdig_auth_session|opensid_auth_session)=[^;]+/);
    if (match) cookieHeader = match[0];
  }
  return { status: res.status, data, cookie: cookieHeader };
}

async function runRBACTests() {
  console.log('====================================================');
  console.log('   STRICT RBAC & MULTI-TENANT ROUTING AUDIT TEST    ');
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

  // 1. Login sebagai Super Admin
  const saLogin = await login('superadmin@platform.desa.id', 'superadmin123');
  assert('Super Admin Login', saLogin.status === 200 && saLogin.data.user?.globalRole === 'SUPER_ADMIN');

  // 2. Login sebagai Admin Desa Salupangkang
  const saluLogin = await login('admin@salupangkang.desa.id', 'salupangkang123', '7606042009');
  assert('Admin Salupangkang Login', saluLogin.status === 200 && saluLogin.data.user?.tenantSlug === 'salupangkang');

  // 3. Login sebagai Admin Desa Sukamaju
  const sukaLogin = await login('admin@sukamaju.desa.id', 'sukamaju123', '32.04.11.2001');
  assert('Admin Sukamaju Login', sukaLogin.status === 200 && sukaLogin.data.user?.tenantSlug === 'sukamaju');

  console.log('\n--- TEST 1: Endpoint Master SaaS (/api/saas/tenants) ---');
  // 1a. Unauthenticated -> 401 / 403
  const resAnonSaas = await fetch(`${BASE_URL}/api/saas/tenants`);
  assert('Unauthenticated call to /api/saas/tenants blocked', resAnonSaas.status === 401 || resAnonSaas.status === 403, `Status: ${resAnonSaas.status}`);

  // 1b. Admin Salupangkang (Manager Desa) -> 403
  const resSaluSaas = await fetch(`${BASE_URL}/api/saas/tenants`, {
    headers: { cookie: saluLogin.cookie },
  });
  assert('Village Manager access to /api/saas/tenants blocked (403)', resSaluSaas.status === 403, `Status: ${resSaluSaas.status}`);

  // 1c. Super Admin -> 200 OK
  const resSaSaas = await fetch(`${BASE_URL}/api/saas/tenants`, {
    headers: { cookie: saLogin.cookie },
  });
  assert('Super Admin access to /api/saas/tenants allowed (200)', resSaSaas.status === 200, `Status: ${resSaSaas.status}`);

  console.log('\n--- TEST 2: Endpoint Kelola Pengguna (/api/users) ---');
  // 2a. Unauthenticated access -> 401
  const resAnonUsers = await fetch(`${BASE_URL}/api/users?tenant=salupangkang`);
  assert('Unauthenticated access to /api/users blocked (401)', resAnonUsers.status === 401, `Status: ${resAnonUsers.status}`);

  // 2b. Admin Salupangkang access ke Salupangkang -> 200 OK
  const resSaluOwnUsers = await fetch(`${BASE_URL}/api/users?tenant=salupangkang`, {
    headers: { cookie: saluLogin.cookie },
  });
  assert('Admin Salupangkang view own village users allowed (200)', resSaluOwnUsers.status === 200, `Status: ${resSaluOwnUsers.status}`);

  // 2c. Admin Salupangkang cross-access ke Sukamaju -> 403 Forbidden!
  const resSaluCrossUsers = await fetch(`${BASE_URL}/api/users?tenant=sukamaju`, {
    headers: { cookie: saluLogin.cookie },
  });
  assert('Admin Salupangkang cross-access to Sukamaju users blocked (403)', resSaluCrossUsers.status === 403, `Status: ${resSaluCrossUsers.status}`);

  // 2d. Super Admin access ke Sukamaju -> 200 OK (Inspeksi Desa)
  const resSaSukaUsers = await fetch(`${BASE_URL}/api/users?tenant=sukamaju`, {
    headers: { cookie: saLogin.cookie },
  });
  assert('Super Admin inspection of Sukamaju users allowed (200)', resSaSukaUsers.status === 200, `Status: ${resSaSukaUsers.status}`);

  console.log('\n--- TEST 3: Endpoint Audit Log (/api/audit) ---');
  // 3a. Unauthenticated access -> 401
  const resAnonAudit = await fetch(`${BASE_URL}/api/audit`);
  assert('Unauthenticated access to /api/audit blocked (401)', resAnonAudit.status === 401, `Status: ${resAnonAudit.status}`);

  // 3b. Admin Salupangkang view own audit -> 200 OK
  const resSaluOwnAudit = await fetch(`${BASE_URL}/api/audit?tenant=salupangkang`, {
    headers: { cookie: saluLogin.cookie },
  });
  assert('Admin Salupangkang view own audit allowed (200)', resSaluOwnAudit.status === 200, `Status: ${resSaluOwnAudit.status}`);

  // 3c. Admin Salupangkang cross-audit ke Sukamaju -> 403 Forbidden!
  const resSaluCrossAudit = await fetch(`${BASE_URL}/api/audit?tenant=sukamaju`, {
    headers: { cookie: saluLogin.cookie },
  });
  assert('Admin Salupangkang cross-audit to Sukamaju blocked (403)', resSaluCrossAudit.status === 403, `Status: ${resSaluCrossAudit.status}`);

  // 3d. Super Admin view global audit -> 200 OK
  const resSaAudit = await fetch(`${BASE_URL}/api/audit`, {
    headers: { cookie: saLogin.cookie },
  });
  assert('Super Admin view global audit logs allowed (200)', resSaAudit.status === 200, `Status: ${resSaAudit.status}`);

  console.log('\n--- TEST 4: Cross-Tenant Mutation Guard (/api/residents) ---');
  // 4a. Admin Salupangkang mencoba input penduduk ke Sukamaju -> 403 Forbidden!
  const resCrossMutation = await fetch(`${BASE_URL}/api/residents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      nik: '9999999999999999',
      nama: 'Infiltrator',
    }),
  });
  assert('Cross-tenant resident mutation by Village Manager blocked (403)', resCrossMutation.status === 403, `Status: ${resCrossMutation.status}`);

  console.log('\n--- TEST 5: Cross-Tenant Content & Settings Guards ---');
  // 5a. Admin Salupangkang mencoba posting artikel ke Sukamaju -> 403 Forbidden!
  const resCrossArticle = await fetch(`${BASE_URL}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      title: 'Artikel Ilegal Salupangkang di Sukamaju',
      slug: 'artikel-ilegal-salupangkang-sukamaju',
      summary: 'Uji coba cross-tenant exploit',
      content: '<p>Konten yang seharusnya dilarang keras</p>',
      status: 'PUBLISHED',
    }),
  });
  assert('Cross-tenant article creation blocked (403)', resCrossArticle.status === 403, `Status: ${resCrossArticle.status}`);

  // 5b. Admin Salupangkang mencoba posting pengumuman ke Sukamaju -> 403 Forbidden!
  const resCrossAnnounce = await fetch(`${BASE_URL}/api/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      title: 'Pengumuman Ilegal',
      content: 'Pengumuman cross-tenant',
      status: 'PUBLISHED',
    }),
  });
  assert('Cross-tenant announcement creation blocked (403)', resCrossAnnounce.status === 403, `Status: ${resCrossAnnounce.status}`);

  // 5c. Admin Salupangkang mencoba ganti tema desa Sukamaju -> 403 Forbidden!
  const resCrossTheme = await fetch(`${BASE_URL}/api/theme`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      themeId: 'traditional-village',
    }),
  });
  assert('Cross-tenant theme modification blocked (403)', resCrossTheme.status === 403, `Status: ${resCrossTheme.status}`);

  // 5d. Admin Salupangkang mencoba toggle modul desa Sukamaju -> 403 Forbidden!
  const resCrossModule = await fetch(`${BASE_URL}/api/modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      moduleKey: 'umkm',
      isEnabled: true,
    }),
  });
  assert('Cross-tenant module toggle blocked (403)', resCrossModule.status === 403, `Status: ${resCrossModule.status}`);

  // 5e. Admin Salupangkang mencoba inject APBDes ke Sukamaju -> 403 Forbidden!
  const resCrossApbdes = await fetch(`${BASE_URL}/api/apbdes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: saluLogin.cookie,
    },
    body: JSON.stringify({
      tenantSlug: 'sukamaju',
      category: 'Pendapatan',
      accountCode: '4.99',
      accountName: 'Dana Gelap',
      budget: 100000000,
    }),
  });
  assert('Cross-tenant APBDes mutation blocked (403)', resCrossApbdes.status === 403, `Status: ${resCrossApbdes.status}`);

  console.log('\n----------------------------------------------------');
  console.log(`Total Pengujian: ${passed + failed}`);
  console.log(`Lolos          : ${passed}`);
  console.log(`Gagal          : ${failed}`);
  console.log('----------------------------------------------------');

  if (failed === 0) {
    console.log('🎉 SELURUH ATURAN RBAC & ISOLASI ROUTING TERVERIFIKASI 100% AMAN!');
  } else {
    process.exit(1);
  }
}

runRBACTests().catch(console.error);
