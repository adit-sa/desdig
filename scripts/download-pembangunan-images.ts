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
  const outputDir = path.join(process.cwd(), 'public', 'uploads', 'pembangunan');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Ambil semua projects
  const projects = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, judul, foto FROM "DevelopmentProject" WHERE foto IS NOT NULL`
  );
  console.log(`📋 Ditemukan ${projects.length} proyek dengan foto.`);

  // 2. Ambil semua dokumentasi
  const docs = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, gambar FROM "DevelopmentDocumentation" WHERE gambar IS NOT NULL`
  );
  console.log(`📋 Ditemukan ${docs.length} foto tahapan progres dokumentasi.`);

  // Set file unik
  const uniqueFilenames = new Set<string>();
  const extractFilename = (urlOrName: string) => {
    if (!urlOrName) return null;
    const parts = urlOrName.split('/');
    return parts[parts.length - 1].trim();
  };

  projects.forEach(p => {
    const fn = extractFilename(p.foto);
    if (fn) uniqueFilenames.add(fn);
  });

  docs.forEach(d => {
    const fn = extractFilename(d.gambar);
    if (fn) uniqueFilenames.add(fn);
  });

  console.log(`🎯 Total file unik yang akan diunduh: ${uniqueFilenames.size}`);

  let downloadedCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (const filename of uniqueFilenames) {
    const localPath = path.join(outputDir, filename);

    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
      skippedCount++;
      continue;
    }

    // Coba unduh dari /desa/upload/galeri/ lalu fallback ke /desa/upload/pembangunan/
    const candidateUrls = [
      `https://salupangkang.desa.id/desa/upload/galeri/${filename}`,
      `https://salupangkang.desa.id/desa/upload/pembangunan/${filename}`,
      `https://salupangkang.desa.id/desa/upload/media/${filename}`
    ];

    let downloaded = false;
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
          const buffer = Buffer.from(await resp.arrayBuffer());
          fs.writeFileSync(localPath, buffer);
          downloaded = true;
          downloadedCount++;
          console.log(`[${downloadedCount}/${uniqueFilenames.size}] ✅ Sukses unduh: ${filename} (${buffer.length} bytes)`);
          break;
        }
      } catch (err: any) {
        // coba url berikutnya
      }
    }

    if (!downloaded) {
      failCount++;
      console.warn(`[${failCount} fail] ⚠️ Tidak dapat mengunduh: ${filename}`);
    }
  }

  console.log(`\n🎉 Selesai mengunduh!`);
  console.log(`   - Berhasil diunduh: ${downloadedCount}`);
  console.log(`   - Sudah ada: ${skippedCount}`);
  console.log(`   - Gagal: ${failCount}`);

  // Update path di database ke /uploads/pembangunan/<filename> jika file ada secara lokal
  console.log('\n🔄 Memperbarui path foto di database ke penyimpanan lokal...');
  
  for (const p of projects) {
    const fn = extractFilename(p.foto);
    if (!fn) continue;
    const localFile = path.join(outputDir, fn);
    const localUrl = fs.existsSync(localFile) 
      ? `/uploads/pembangunan/${fn}` 
      : `/images/desa_irigasi_pertanian.jpg`; // Fallback lokal berkualitas

    await prisma.$executeRawUnsafe(
      `UPDATE "DevelopmentProject" SET foto = $1 WHERE id = $2`,
      localUrl,
      p.id
    );
  }

  for (const d of docs) {
    const fn = extractFilename(d.gambar);
    if (!fn) continue;
    const localFile = path.join(outputDir, fn);
    const localUrl = fs.existsSync(localFile) 
      ? `/uploads/pembangunan/${fn}` 
      : `/images/desa_irigasi_pertanian.jpg`; // Fallback lokal berkualitas

    await prisma.$executeRawUnsafe(
      `UPDATE "DevelopmentDocumentation" SET gambar = $1 WHERE id = $2`,
      localUrl,
      d.id
    );
  }

  console.log('✅ Selesai memperbarui database dengan foto lokal!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
