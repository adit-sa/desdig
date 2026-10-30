import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

// Generator data pelapak bawaan yang dinamis dan terisolasi per tenant
function getSampleMerchantsForTenant(namaDesa: string, slug: string) {
  return [
    {
      name: 'Ibu Fatimah',
      shopName: `Lapak Berkah Desa ${namaDesa}`,
      slug: `lapak-berkah-${slug}`,
      phone: '6281234567890',
      address: `Dusun 1 RT 02, Desa ${namaDesa}`,
      description: `Menjual aneka olahan hasil kebun lokal, keripik pisang renyah, dan gula aren asli petani Desa ${namaDesa}.`,
      avatarUrl: '/images/desa_umkm_produk.jpg',
      products: [
        {
          name: 'Keripik Pisang Raja Renyah (250g)',
          description: 'Keripik pisang pilihan dengan rasa gurih manis alami tanpa bahan pengawet.',
          price: 15000,
          unit: 'bungkus',
          category: 'Makanan & Minuman',
          imageUrl: '/images/desa_umkm_produk.jpg',
          isAvailable: true,
        },
        {
          name: 'Gula Aren Cetak Murni',
          description: `Gula merah aren asli dari pohon enau perbukitan ${namaDesa}.`,
          price: 25000,
          unit: 'kg',
          category: 'Makanan & Minuman',
          imageUrl: '/images/desa_umkm_produk.jpg',
          isAvailable: true,
        },
      ],
    },
    {
      name: 'Pak Ahmad',
      shopName: `Tani Makmur & Sayur Segar ${namaDesa}`,
      slug: `tani-makmur-${slug}`,
      phone: '6281987654321',
      address: `Dusun 2 Blok B, Desa ${namaDesa}`,
      description: `Penyedia sayuran segar organik dan bibit tanaman unggul langsung dari kebun warga Desa ${namaDesa}.`,
      avatarUrl: '/images/desa_irigasi_pertanian.jpg',
      products: [
        {
          name: 'Beras Organik Pandan Wangi (5kg)',
          description: `Beras pulen aromatik hasil panen sawah irigasi teknis Desa ${namaDesa}.`,
          price: 75000,
          unit: 'karung',
          category: 'Pertanian & Perkebunan',
          imageUrl: '/images/desa_irigasi_pertanian.jpg',
          isAvailable: true,
        },
        {
          name: 'Cabai Rawit Merah Segar (1kg)',
          description: 'Cabai rawit segar langsung petik hari ini dari kebun warga.',
          price: 45000,
          unit: 'kg',
          category: 'Pertanian & Perkebunan',
          imageUrl: '/images/desa_irigasi_pertanian.jpg',
          isAvailable: true,
        },
      ],
    },
  ];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';

    // Ambil tenant terisolasi
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Cek jika belum ada merchant, seed default sample khusus tenant ini
    const existingCount = await prisma.merchant.count({
      where: { tenantId: tenant.id },
    });

    if (existingCount === 0) {
      const sampleMerchants = getSampleMerchantsForTenant(tenant.namaDesa, tenant.slug);
      for (const m of sampleMerchants) {
        await prisma.merchant.create({
          data: {
            tenantId: tenant.id,
            name: m.name,
            shopName: m.shopName,
            slug: m.slug,
            phone: m.phone,
            address: m.address,
            description: m.description,
            avatarUrl: m.avatarUrl,
            products: {
              create: m.products,
            },
          },
        });
      }
    }

    // Query merchants
    const whereClause: any = {
      tenantId: tenant.id,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { shopName: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        {
          products: {
            some: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const merchants = await prisma.merchant.findMany({
      where: whereClause,
      include: {
        resident: {
          select: {
            id: true,
            nik: true,
            nama: true,
            dusun: true,
            alamat: true,
            telepon: true,
          },
        },
        products: {
          where: category && category !== 'ALL' ? { category } : undefined,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, merchants });
  } catch (error: any) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat pelapak' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { name, shopName, phone, address, description, avatarUrl, bannerUrl, residentId } = body;

    if (!name || !shopName || !phone) {
      return NextResponse.json(
        { error: 'Nama pelapak, nama usaha/toko, dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = shopName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = 'lapak-' + Date.now();

    let finalSlug = baseSlug;
    let counter = 1;
    while (
      await prisma.merchant.findFirst({
        where: { tenantId: tenant.id, slug: finalSlug },
      })
    ) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const merchant = await prisma.merchant.create({
      data: {
        tenantId: tenant.id,
        residentId: residentId || null,
        name,
        shopName,
        slug: finalSlug,
        phone: phone.replace(/^0/, '62').replace(/[^\d]/g, ''),
        address: address || null,
        description: description || null,
        avatarUrl: avatarUrl || null,
        bannerUrl: bannerUrl || null,
        isActive: true,
      },
      include: {
        resident: true,
        products: true,
      },
    });

    return NextResponse.json({ success: true, merchant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating merchant:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pelapak' }, { status: 500 });
  }
}
