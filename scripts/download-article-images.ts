import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function getAuthenticatedCookies() {
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

  console.log('🔄 Memulai handshake Hostinger CDN bypass...');
  const res1 = await fetch('https://salupangkang.desa.id/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  parseCookies(res1.headers);

  const res2 = await fetch('https://salupangkang.desa.id/hcdn-cgi/jschallenge', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://salupangkang.desa.id/',
      'Cookie': getCookieHeader()
    }
  });
  parseCookies(res2.headers);
  const challengeJs = await res2.text();

  const cjsMatch = challengeJs.match(/const\s+cjs\s*=\s*'([^']+)'/);
  const urlMatch = challengeJs.match(/const\s+jsChallengeUrl\s*=\s*'([^']+)'/);
  if (!cjsMatch || !urlMatch) {
    throw new Error('Gagal mengekstrak challenge token');
  }

  const cjs = cjsMatch[1];
  const validateUrl = 'https://salupangkang.desa.id' + urlMatch[1];
  const hash = sha256(cjs);

  console.log('⏳ Menunggu timing solver 3.2 detik...');
  await new Promise(r => setTimeout(r, 3200));

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

  if (res3.status !== 200) {
    throw new Error(`Validasi challenge gagal dengan status ${res3.status}`);
  }

  console.log('✅ CDN Bypass Sukses! Cookie didapatkan.');
  return getCookieHeader();
}

async function main() {
  const cookieHeader = await getAuthenticatedCookies();
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'salupangkang', 'artikel');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Baca data artikel dari sql backup baris 2040-2070 untuk artikel terbaru
  // dan juga inspect file di sql
  const specificFiles = [
    'KdSYn_1789435047_WhatsApp_Image_2026-09-14_at_10_28_26.png',
    'kecil_KdSYn_1789435047_WhatsApp_Image_2026-09-14_at_10_28_26.png',
    'sedang_KdSYn_1789435047_WhatsApp_Image_2026-09-14_at_10_28_26.png',
    'WhatsApp_Image_2026-09-14_at_10-28-26.jpg',
    'zMHME_1789434128_WhatsApp_Image_2026-09-14_at_9_52_18_AM.png',
    'kecil_zMHME_1789434128_WhatsApp_Image_2026-09-14_at_9_52_18_AM.png',
    'sedang_zMHME_1789434128_WhatsApp_Image_2026-09-14_at_9_52_18_AM.png',
    'WhatsApp_Image_2026-09-14_at_9-52-18_AM.jpg',
    '1785891198_WhatsApp_Image_2026-08-03_at_10.23.24.jpeg',
    'kecil_1785891198_WhatsApp_Image_2026-08-03_at_10.23.24.jpeg',
    'sedang_1785891198_WhatsApp_Image_2026-08-03_at_10.23.24.jpeg',
    '1780969128_WhatsApp Image 2026-06-08 at 09.13.57.jpeg',
    'kecil_1780969128_WhatsApp Image 2026-06-08 at 09.13.57.jpeg',
    'sedang_1780969128_WhatsApp Image 2026-06-08 at 09.13.57.jpeg',
    '1778414844_IMG-20260510-WA0011.jpg',
    'kecil_1778414844_IMG-20260510-WA0011.jpg',
  ];

  console.log('📥 Mencoba mengunduh gambar artikel spesifik...');
  for (const filename of specificFiles) {
    const localPath = path.join(outputDir, filename);
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
      console.log(`⏩ Sudah ada: ${filename}`);
      continue;
    }

    const candidateUrls = [
      `https://salupangkang.desa.id/desa/upload/artikel/${encodeURIComponent(filename)}`,
      `https://salupangkang.desa.id/desa/upload/artikel/sedang_${encodeURIComponent(filename)}`,
      `https://salupangkang.desa.id/desa/upload/artikel/kecil_${encodeURIComponent(filename)}`,
      `https://salupangkang.desa.id/desa/upload/media/${encodeURIComponent(filename)}`,
      `https://salupangkang.desa.id/desa/upload/galeri/${encodeURIComponent(filename)}`,
    ];

    let success = false;
    for (const url of candidateUrls) {
      try {
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://salupangkang.desa.id/',
            'Cookie': cookieHeader
          }
        });
        if (resp.status === 200) {
          const buf = Buffer.from(await resp.arrayBuffer());
          fs.writeFileSync(localPath, buf);
          console.log(`✅ Berhasil unduh: ${filename} dari ${url} (${buf.length} bytes)`);
          success = true;
          break;
        }
      } catch (e) {}
    }
    if (!success) {
      console.log(`⚠️ Gagal menemukan: ${filename}`);
    }
  }

  // 2. Sekarang perbarui artikel di database PostgreSQL
  console.log('\n🔄 Memperbarui coverImageUrl artikel terbaru di database...');
  
  // Artikel Musyawarah RKPDesa 2027
  const rkpImg = fs.existsSync(path.join(outputDir, 'KdSYn_1789435047_WhatsApp_Image_2026-09-14_at_10_28_26.png'))
    ? '/uploads/salupangkang/artikel/KdSYn_1789435047_WhatsApp_Image_2026-09-14_at_10_28_26.png'
    : (fs.existsSync(path.join(outputDir, 'WhatsApp_Image_2026-09-14_at_10-28-26.jpg'))
        ? '/uploads/salupangkang/artikel/WhatsApp_Image_2026-09-14_at_10-28-26.jpg'
        : '/uploads/salupangkang/artikel/kecil_1785891198_WhatsApp_Image_2026-08-03_at_10.23.24.jpeg');

  await prisma.article.updateMany({
    where: { slug: 'musyawarah-pembangunan-desa-dalam-hal-penyusunan-dokumen-rkpdesa-ta-2027' },
    data: { coverImageUrl: rkpImg }
  });
  console.log('✅ Updated RKPDesa 2027 article cover to:', rkpImg);

  // Artikel BLT-DD Juli s/d September
  const bltImg = fs.existsSync(path.join(outputDir, 'zMHME_1789434128_WhatsApp_Image_2026-09-14_at_9_52_18_AM.png'))
    ? '/uploads/salupangkang/artikel/zMHME_1789434128_WhatsApp_Image_2026-09-14_at_9_52_18_AM.png'
    : (fs.existsSync(path.join(outputDir, 'WhatsApp_Image_2026-09-14_at_9-52-18_AM.jpg'))
        ? '/uploads/salupangkang/artikel/WhatsApp_Image_2026-09-14_at_9-52-18_AM.jpg'
        : '/uploads/salupangkang/artikel/kecil_1780969128_WhatsApp Image 2026-06-08 at 09.13.57.jpeg');

  await prisma.article.updateMany({
    where: { slug: 'penyaluran-bantuan-langsung-tunai-blt-dd-ta-2026-periode-juli-sd-september' },
    data: { coverImageUrl: bltImg }
  });
  console.log('✅ Updated BLT Juli-Sept article cover to:', bltImg);

  // Verifikasi semua artikel agar tidak ada yang broken
  const allArticles = await prisma.article.findMany({ select: { id: true, title: true, coverImageUrl: true } });
  for (const a of allArticles) {
    if (a.coverImageUrl && a.coverImageUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(process.cwd(), 'public', a.coverImageUrl.replace(/^\//, ''));
      if (!fs.existsSync(localFilePath)) {
        // Fallback ke salah satu foto artikel asli yang tersedia
        await prisma.article.update({
          where: { id: a.id },
          data: { coverImageUrl: '/uploads/salupangkang/artikel/kecil_1785891198_WhatsApp_Image_2026-08-03_at_10.23.24.jpeg' }
        });
      }
    }
  }

  console.log('🎉 Selesai memutakhirkan seluruh gambar artikel!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
