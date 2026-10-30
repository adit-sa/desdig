import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';

interface MediaFile {
  url: string;
  name: string;
  size: number;
  folder: string;
  type: 'image' | 'video';
  modifiedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenant') || '';
    const folderFilter = searchParams.get('folder'); // e.g. "galeri"
    const searchQuery = (searchParams.get('q') || '').toLowerCase().trim();

    if (!tenantParam) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    const cleanTenant = tenantParam.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const tenant = await prisma.tenant.findUnique({
      where: { slug: cleanTenant },
      select: { id: true, slug: true, namaDesa: true },
    });

    const results: MediaFile[] = [];
    const seenUrls = new Set<string>();

    // 1. Scan filesystem under public/uploads/[cleanTenant]
    const baseDir = path.join(process.cwd(), 'public', 'uploads', cleanTenant);

    async function scanDirectory(dir: string, currentSubfolder: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Recurse into subdirectories (up to 3 levels)
            const nextSub = currentSubfolder ? `${currentSubfolder}/${entry.name}` : entry.name;
            await scanDirectory(fullPath, nextSub);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);
            const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);

            if (isImage || isVideo) {
              const url = `/uploads/${cleanTenant}/${currentSubfolder ? `${currentSubfolder}/` : ''}${entry.name}`;
              if (!seenUrls.has(url)) {
                seenUrls.add(url);
                try {
                  const stat = await fs.stat(fullPath);
                  results.push({
                    url,
                    name: entry.name,
                    size: stat.size,
                    folder: currentSubfolder || 'utama',
                    type: isVideo ? 'video' : 'image',
                    modifiedAt: stat.mtime.toISOString(),
                  });
                } catch {
                  // ignore stat errors
                }
              }
            }
          }
        }
      } catch {
        // Directory may not exist yet, that's okay
      }
    }

    await scanDirectory(baseDir, '');

    // 2. Also check common/fallback public/images if relevant
    const commonImagesDir = path.join(process.cwd(), 'public', 'images');
    try {
      const commonEntries = await fs.readdir(commonImagesDir, { withFileTypes: true });
      for (const entry of commonEntries) {
        if (entry.isFile() && entry.name.match(/\.(jpg|jpeg|png|webp|svg)$/i)) {
          const url = `/images/${entry.name}`;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            results.push({
              url,
              name: entry.name,
              size: 0,
              folder: 'pustaka-bawaan',
              type: 'image',
              modifiedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Filter by search query or folder
    let filtered = results;
    if (folderFilter && folderFilter !== 'ALL') {
      filtered = filtered.filter((f) => f.folder.toLowerCase() === folderFilter.toLowerCase());
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (f) => f.name.toLowerCase().includes(searchQuery) || f.folder.toLowerCase().includes(searchQuery)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    // Extract unique folders for filter tabs
    const availableFolders = Array.from(new Set(results.map((f) => f.folder))).filter(Boolean);

    return NextResponse.json({
      success: true,
      tenant: cleanTenant,
      total: filtered.length,
      folders: availableFolders,
      files: filtered.slice(0, 100), // Return up to 100 media items
    });
  } catch (error: any) {
    console.error('Error fetching media library:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat pustaka media' },
      { status: 500 }
    );
  }
}
