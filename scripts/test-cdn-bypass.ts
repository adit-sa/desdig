import crypto from 'crypto';

// Implementasi bbc6cf0 sama dengan SHA-256 standar
function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function test() {
  const cookieJar: Record<string, string> = {};

  function parseCookies(headers: Headers) {
    const setCookie = headers.getSetCookie ? headers.getSetCookie() : [headers.get('set-cookie') || ''];
    for (const c of setCookie) {
      if (!c) continue;
      const parts = c.split(';')[0].split('=');
      if (parts.length >= 2) {
        cookieJar[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    }
  }

  function getCookieHeader() {
    return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  // Step 1: Hit landing page
  console.log('1. Fetching root page...');
  const res1 = await fetch('https://salupangkang.desa.id/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  parseCookies(res1.headers);
  console.log('Status 1:', res1.status, 'Cookies:', cookieJar);

  // Step 2: Fetch /hcdn-cgi/jschallenge
  console.log('2. Fetching /hcdn-cgi/jschallenge...');
  const res2 = await fetch('https://salupangkang.desa.id/hcdn-cgi/jschallenge', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://salupangkang.desa.id/',
      'Cookie': getCookieHeader()
    }
  });
  parseCookies(res2.headers);
  const challengeJs = await res2.text();
  console.log('Challenge JS:', challengeJs.trim());

  const cjsMatch = challengeJs.match(/const\s+cjs\s*=\s*'([^']+)'/);
  const urlMatch = challengeJs.match(/const\s+jsChallengeUrl\s*=\s*'([^']+)'/);
  if (!cjsMatch || !urlMatch) {
    console.error('Failed to parse cjs');
    return;
  }
  const cjs = cjsMatch[1];
  const validateUrl = 'https://salupangkang.desa.id' + urlMatch[1];
  console.log('cjs:', cjs, 'validateUrl:', validateUrl);

  // Compute hash
  const hash = sha256(cjs);
  console.log('Hash:', hash);

  // Wait 3.5s like the script
  console.log('Waiting 3.2s...');
  await new Promise(r => setTimeout(r, 3200));

  // Step 3: POST validate
  console.log('3. Posting validation...');
  const res3 = await fetch(validateUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://salupangkang.desa.id/',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': getCookieHeader()
    },
    body: `challenge=${hash}`
  });
  parseCookies(res3.headers);
  console.log('Status 3:', res3.status, await res3.text());
  console.log('Current cookies:', cookieJar);

  // Step 4: Check pembangunan page on live site
  console.log('4. Trying to fetch pembangunan page...');
  const res4 = await fetch('https://salupangkang.desa.id/pembangunan', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://salupangkang.desa.id/',
      'Cookie': getCookieHeader()
    }
  });
  console.log('Status /pembangunan:', res4.status);
  const htmlPembangunan = await res4.text();

  // Test variations of folders
  const filename = '1729131746WhatsAppImage2024-10-17at095527__sid__j9U8vTw.jpeg';
  const folders = [
    'desa/upload/galeri',
    'desa/upload/galeri/kecil_',
    'desa/upload/galeri/sedang_',
    'desa/upload/pembangunan',
    'desa/upload/pembangunan/kecil_',
    'desa/upload/pembangunan/sedang_',
    'desa/upload/media',
    'desa/upload/dokumen',
    'desa/upload/pengesahan',
    'assets/files/pembangunan',
    'desa/upload/artikel',
    'desa/upload/artikel/kecil_',
    'desa/upload/artikel/sedang_'
  ];

  for (const folder of folders) {
    let u = '';
    if (folder.endsWith('_')) {
      const dir = folder.substring(0, folder.lastIndexOf('/'));
      const prefix = folder.substring(folder.lastIndexOf('/') + 1);
      u = `https://salupangkang.desa.id/${dir}/${prefix}${filename}`;
    } else {
      u = `https://salupangkang.desa.id/${folder}/${filename}`;
    }
    const r = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://salupangkang.desa.id/',
        'Cookie': getCookieHeader()
      }
    });
    console.log(u, '=>', r.status);
    if (r.status === 200) {
      console.log('!!! SUCCESS FOUND FOLDER:', u);
      break;
    }
  }
}

test().catch(console.error);
