/**
 * Smart Article & Page Content Formatter
 * Mengonversi teks biasa, Markdown (MD), atau HTML menjadi tampilan artikel web yang rapi,
 * sehingga petugas desa / orang awam dapat menulis tanpa harus mengerti kode HTML.
 *
 * Fitur:
 * - Enter 2x otomatis jadi Paragraf baru (<p>)
 * - Enter 1x otomatis jadi Baris baru (<br/>)
 * - ## Judul Bab / ### Sub-judul
 * - **Teks Tebal** & *Teks Miring*
 * - [Nama Link](https://...) otomatis jadi link yang bisa diklik
 * - ![Keterangan](url) otomatis jadi gambar dokumentasi dengan caption
 * - > Kutipan / Pernyataan
 * - - Poin daftar & 1. Penomoran urut
 * - Tetap mendukung tag HTML lama secara aman
 */

export function formatArticleContent(content: string | null | undefined): string {
  if (!content) return '';

  const trimmed = content.trim();
  if (!trimmed) return '';

  // Jika konten sudah berupa HTML penuh dengan tag <p> atau <div>, kita lakukan sanitasi ringan & link enhancement
  const hasHtmlParagraphs = /<\/?(p|div|section|article)\b/i.test(trimmed);

  if (hasHtmlParagraphs) {
    // Tetap pastikan link eksternal membuka tab baru
    return trimmed.replace(
      /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)>/gi,
      (match, q, href, rest) => {
        if (!rest.includes('target=')) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-semibold hover:text-emerald-900"${rest}>`;
        }
        return match;
      }
    );
  }

  // Pisahkan konten per blok baris kosong (paragraf)
  const rawBlocks = trimmed.split(/\n\s*\n/);
  const formattedBlocks: string[] = [];

  for (let block of rawBlocks) {
    let b = block.trim();
    if (!b) continue;

    // 1. Gambar Markdown: ![Caption](url)
    const imgMatch = b.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const caption = imgMatch[1] || 'Dokumentasi Berita';
      const url = imgMatch[2];
      formattedBlocks.push(
        `<figure class="my-6 text-center">
          <img src="${url}" alt="${escapeHtml(caption)}" class="rounded-2xl max-h-[500px] w-full object-cover shadow-md mx-auto" loading="lazy" />
          <figcaption class="text-xs text-slate-500 mt-2.5 italic font-medium">${escapeHtml(caption)}</figcaption>
        </figure>`
      );
      continue;
    }

    // 2. Headings: # H1, ## H2, ### H3, #### H4
    if (/^#{1,6}\s+/.test(b)) {
      if (b.startsWith('#### ')) {
        formattedBlocks.push(`<h4 class="text-base font-bold text-slate-800 mt-5 mb-2">${formatInline(b.replace(/^####\s+/, ''))}</h4>`);
      } else if (b.startsWith('### ')) {
        formattedBlocks.push(`<h3 class="text-lg font-bold text-slate-800 mt-6 mb-2.5">${formatInline(b.replace(/^###\s+/, ''))}</h3>`);
      } else if (b.startsWith('## ')) {
        formattedBlocks.push(`<h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-7 mb-3 pb-1 border-b border-slate-100">${formatInline(b.replace(/^##\s+/, ''))}</h2>`);
      } else if (b.startsWith('# ')) {
        formattedBlocks.push(`<h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-8 mb-4">${formatInline(b.replace(/^#\s+/, ''))}</h2>`);
      }
      continue;
    }

    // 3. Blockquote: > Kutipan
    if (b.startsWith('>')) {
      const quoteText = b
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join(' ');
      formattedBlocks.push(
        `<blockquote class="border-l-4 border-emerald-600 bg-emerald-50/60 p-4 rounded-r-2xl italic my-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          &ldquo;${formatInline(quoteText)}&rdquo;
        </blockquote>`
      );
      continue;
    }

    // 4. Deteksi List Poin & Campuran Paragraf + List
    const lines = b.split('\n');
    let hasBullet = false;
    let hasNumbered = false;

    for (const line of lines) {
      if (/^[-*•]\s+/.test(line.trim())) hasBullet = true;
      if (/^\d+\.\s+/.test(line.trim())) hasNumbered = true;
    }

    if (hasBullet || hasNumbered) {
      let currentType: 'p' | 'ul' | 'ol' | null = null;
      let currentItems: string[] = [];

      const flush = () => {
        if (!currentType || currentItems.length === 0) return;
        if (currentType === 'p') {
          formattedBlocks.push(`<p class="leading-relaxed text-slate-700 text-sm sm:text-base my-3">${currentItems.join('<br/>')}</p>`);
        } else if (currentType === 'ul') {
          formattedBlocks.push(`<ul class="list-disc pl-5 my-3 space-y-1.5 text-slate-700 text-sm sm:text-base">${currentItems.map(i => `<li>${i}</li>`).join('')}</ul>`);
        } else if (currentType === 'ol') {
          formattedBlocks.push(`<ol class="list-decimal pl-5 my-3 space-y-1.5 text-slate-700 text-sm sm:text-base">${currentItems.map(i => `<li>${i}</li>`).join('')}</ol>`);
        }
        currentItems = [];
        currentType = null;
      };

      for (const line of lines) {
        const tr = line.trim();
        if (/^[-*•]\s+/.test(tr)) {
          if (currentType !== 'ul') {
            flush();
            currentType = 'ul';
          }
          currentItems.push(formatInline(tr.replace(/^[-*•]\s+/, '')));
        } else if (/^\d+\.\s+/.test(tr)) {
          if (currentType !== 'ol') {
            flush();
            currentType = 'ol';
          }
          currentItems.push(formatInline(tr.replace(/^\d+\.\s+/, '')));
        } else {
          if (currentType !== 'p') {
            flush();
            currentType = 'p';
          }
          currentItems.push(formatInline(tr));
        }
      }
      flush();
      continue;
    }

    // 5. Paragraf Biasa: Enter tunggal di dalam paragraf dijadikan <br/>
    const pLines = lines.map((l) => formatInline(l.trim()));
    const paragraphContent = pLines.join('<br/>');
    formattedBlocks.push(`<p class="leading-relaxed text-slate-700 text-sm sm:text-base my-3">${paragraphContent}</p>`);
  }

  return formattedBlocks.join('\n');
}

/**
 * Format inline elements: Bold, Italic, Links, Code, Tags
 */
function formatInline(text: string): string {
  if (!text) return '';

  let res = text;

  // 1. Tautan / Link Markdown: [Nama Link](https://...)
  res = res.replace(/\[(.*?)\]\((.*?)\)/g, (match, title, url) => {
    const cleanUrl = url.trim();
    const cleanTitle = title.trim() || cleanUrl;
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-emerald-900 underline font-semibold inline-flex items-center gap-0.5">${cleanTitle}</a>`;
  });

  // 2. Bold: **teks**
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');

  // 3. Italic: *teks*
  res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');

  // 4. Strikethrough: ~~teks~~
  res = res.replace(/~~(.*?)~~/g, '<del class="line-through text-slate-400">$1</del>');

  // 5. Auto Link raw URLs if not already linked (e.g. https://kemendesa.go.id)
  res = res.replace(/(?<!href=["'])(https?:\/\/[^\s<]+)/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-emerald-900 underline font-semibold">${url}</a>`;
  });

  return res;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
