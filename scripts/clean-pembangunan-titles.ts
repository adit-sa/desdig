import { prisma } from '../lib/prisma';

export function formatProjectTitle(title: string): string {
  if (!title) return '';
  const uppercaseWords = new Set(['RT', 'RW', 'F', 'PAUD', 'TK', 'SD', 'SMP', 'SMA', 'SMK', 'PAMSIMAS', 'SPAL', 'MCK', 'POSYANDU', 'BPD', 'LPM', 'PKK', 'APBD', 'APBDES', 'APBN', 'ADD', 'DD', 'PADES', 'KUBE', 'UMKM', 'PLTS', 'PJU', 'RTLH', 'DAM', 'TPS']);
  const lowercaseWords = new Set(['di', 'ke', 'dari', 'dan', 'atau', 'yang', 'untuk', 'pada', 'dengan', 'oleh']);

  const words = title.trim().split(/\s+/);
  return words.map((w, index) => {
    const clean = w.replace(/[^a-zA-Z0-9]/g, '');
    const upperClean = clean.toUpperCase();
    if (uppercaseWords.has(upperClean)) {
      return w.replace(clean, upperClean);
    }
    if (/^RT\.?\d+$/i.test(w)) return w.toUpperCase();
    if (/^RW\.?\d+$/i.test(w)) return w.toUpperCase();

    const lower = w.toLowerCase();
    if (index > 0 && lowercaseWords.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

async function main() {
  const projects = await prisma.$queryRawUnsafe<any[]>(`SELECT id, judul FROM "DevelopmentProject"`);
  console.log(`Found ${projects.length} projects to update.`);

  for (const p of projects) {
    const formatted = formatProjectTitle(p.judul);
    if (formatted !== p.judul) {
      await prisma.$executeRawUnsafe(
        `UPDATE "DevelopmentProject" SET judul = $1 WHERE id = $2`,
        formatted,
        p.id
      );
      console.log(`Updated: "${p.judul}" -> "${formatted}"`);
    }
  }

  console.log('Finished updating DevelopmentProject titles.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
