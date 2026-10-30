import { z } from 'zod';

export const articleSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),
  slug: z.string().min(3).max(220).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)'),
  summary: z.string().min(10, 'Ringkasan minimal 10 karakter').max(500, 'Ringkasan maksimal 500 karakter'),
  content: z.string().min(20, 'Konten artikel minimal 20 karakter'),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  coverImageUrl: z.string().optional().or(z.literal('')).nullable(),
  galleryUrls: z.any().optional(),
  authorResidentId: z.string().optional().nullable(),
});

export const themeSwitchSchema = z.object({
  themeId: z.enum(['modern-government', 'traditional-village', 'modern-editorial']),
  settings: z.record(z.string(), z.any()).optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter').max(150),
  content: z.string().min(10, 'Isi pengumuman minimal 10 karakter'),
  isPinned: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  expiresAt: z.string().optional().nullable().or(z.date()),
});

export const officialSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  position: z.string().min(2, 'Jabatan minimal 2 karakter'),
  nip: z.string().optional().nullable(),
  photoUrl: z.string().optional().or(z.literal('')).nullable(),
  orderIndex: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  residentId: z.string().optional().nullable(),
  pinCode: z.string().optional().nullable(),
});
