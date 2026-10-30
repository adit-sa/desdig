import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || 'ALL';

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Auto seed contoh halaman jika belum ada
    const count = await prisma.customPage.count({
      where: { tenantId: tenant.id },
    });

    if (count === 0) {
      await prisma.customPage.createMany({
        data: [
          {
            tenantId: tenant.id,
            title: `Sejarah & Asal Usul Desa ${tenant.namaDesa}`,
            slug: 'sejarah-desa',
            summary: `Mengenal rekam jejak, asal-usul penamaan, dan sejarah peradaban berdirinya Desa ${tenant.namaDesa}.`,
            content: `<h3>Asal Usul & Sejarah Desa</h3>
<p>Desa ${tenant.namaDesa} memiliki sejarah panjang yang berakar dari semangat persaudaraan dan kebersamaan para perintis wilayah terdahulu. Pada awalnya kawasan ini merupakan pemukiman agraris subur dengan kekayaan sumber daya alam yang melimpah.</p>
<p>Seiring berjalannya waktu dan bertambahnya populasi, masyarakat bersepakat untuk membentuk tatanan pemerintahan mandiri demi mempercepat pemerataan pelayanan dan pembangunan.</p>
<h3>Tonggak Perkembangan Menuju Desa Mandiri</h3>
<p>Kini di era modern, Desa ${tenant.namaDesa} terus bertransformasi menuju desa digital berbasis keterbukaan informasi publik, akuntabilitas anggaran, dan penguatan ekonomi kerakyatan melalui sentra UMKM dan pertanian modern.</p>`,
            coverImageUrl: tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg',
            status: 'PUBLISHED',
            viewCount: 42,
          },
          {
            tenantId: tenant.id,
            title: `Profil Wilayah & Geografis Desa ${tenant.namaDesa}`,
            slug: 'profil-wilayah',
            summary: `Batas wilayah administratif, luas lahan produktif, dan potensi bentang alam Desa ${tenant.namaDesa}.`,
            content: `<h3>Kondisi Geografis & Batas Wilayah</h3>
<p>Desa ${tenant.namaDesa} terletak di Kecamatan ${tenant.kecamatan}, Kabupaten ${tenant.kabupaten}, Provinsi ${tenant.provinsi}. Memiliki bentang topografi yang variatif antara lahan persawahan irigasi teknis dan perkebunan produktif.</p>
<ul>
  <li><strong>Utara:</strong> Berbatasan dengan wilayah persawahan</li>
  <li><strong>Selatan:</strong> Berbatasan dengan aliran sungai utama</li>
  <li><strong>Timur:</strong> Berbatasan dengan sentra perkebunan</li>
  <li><strong>Barat:</strong> Berbatasan dengan jalan poros penghubung antar-kecamatan</li>
</ul>
<h3>Tata Guna Lahan & Potensi Wilayah</h3>
<p>Mayoritas pemanfaatan lahan diperuntukkan bagi sektor pertanian padi sawah, perkebunan tanaman keras, pemukiman teratur, serta fasilitas umum sosial masyarakat.</p>`,
            coverImageUrl: '/images/desa_irigasi_pertanian.jpg',
            status: 'PUBLISHED',
            viewCount: 28,
          },
          {
            tenantId: tenant.id,
            title: `Regulasi & Produk Hukum Desa ${tenant.namaDesa}`,
            slug: 'regulasi-perdes',
            summary: `Kumpulan Peraturan Desa (Perdes), Keputusan Kepala Desa, dan landasan hukum tata kelola pemerintahan desa.`,
            content: `<h3>Landasan Hukum Tata Kelola Desa</h3>
<p>Penyelenggaraan pemerintahan Desa ${tenant.namaDesa} berasaskan kepastian hukum, tertib penyelenggaraan negara, kepentingan umum, keterbukaan, proporsionalitas, profesionalitas, dan akuntabilitas.</p>
<h3>Daftar Regulasi & Peraturan Desa Utama</h3>
<ul>
  <li><strong>Peraturan Desa tentang Rencana Kerja Pemerintah Desa (RKPDes)</strong></li>
  <li><strong>Peraturan Desa tentang Anggaran Pendapatan dan Belanja Desa (APBDes)</strong></li>
  <li><strong>Peraturan Desa tentang Lembaga Kemasyarakatan Desa dan Pengelolaan Lingkungan</strong></li>
</ul>`,
            coverImageUrl: '/images/balai_desa_gedung.jpg',
            status: 'PUBLISHED',
            viewCount: 19,
          },
        ],
      });
    }

    const where: any = {
      tenantId: tenant.id,
    };

    if (status !== 'ALL') {
      where.status = status;
    }

    if (query.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    const pages = await prisma.customPage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil daftar halaman' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, summary, content, coverImageUrl, galleryUrls, status = 'PUBLISHED', tenantSlug, tenantId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul halaman wajib diisi' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Isi konten halaman wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug || tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    // Clean & validate slug
    let finalSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!finalSlug) finalSlug = `halaman-${Date.now()}`;

    // Cek slug unik per tenant
    const existing = await prisma.customPage.findUnique({
      where: {
        tenantId_slug: {
          tenantId: tenant.id,
          slug: finalSlug,
        },
      },
    });

    if (existing) {
      finalSlug = `${finalSlug}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    const newPage = await prisma.customPage.create({
      data: {
        tenantId: tenant.id,
        title: title.trim(),
        slug: finalSlug,
        summary: summary ? summary.trim() : null,
        content: content.trim(),
        coverImageUrl: coverImageUrl || null,
        galleryUrls: galleryUrls || null,
        status: status as any,
      } as any,
    });

    return NextResponse.json({ success: true, page: newPage });
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat halaman baru' }, { status: 500 });
  }
}
