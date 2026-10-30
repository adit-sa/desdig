import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantSlug = searchParams.get('tenant');

    let whereClause: any = {};

    if (session.globalRole === 'SUPER_ADMIN') {
      // Super Admin bebas memfilter tenant manapun atau melihat seluruh tenant
      if (requestedTenantSlug) {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: requestedTenantSlug },
        });
        if (tenant) {
          whereClause.tenantId = tenant.id;
        }
      }
    } else {
      // Village Manager / Admin: HANYA berhak melihat audit log desanya sendiri!
      if (requestedTenantSlug && requestedTenantSlug.toLowerCase() !== (session.tenantSlug || '').toLowerCase()) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda tidak berhak melihat log audit desa lain.' },
          { status: 403 }
        );
      }

      if (session.tenantId) {
        whereClause.tenantId = session.tenantId;
      } else if (session.tenantSlug) {
        const tenant = await prisma.tenant.findUnique({
          where: { slug: session.tenantSlug },
        });
        if (tenant) whereClause.tenantId = tenant.id;
      }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: { namaDesa: true, slug: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ auditLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
