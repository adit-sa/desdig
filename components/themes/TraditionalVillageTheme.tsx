import React from 'react';
import Link from 'next/link';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import {
  Calendar,
  Eye,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  TrendingUp,
  HeartHandshake,
  Compass,
  ChevronRight,
  ShieldCheck,
  Megaphone,
  Landmark,
  FileText,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import { formatAnnouncementDateTime, getTimezoneByProvince } from '@/lib/timezone';
import { formatKodeKemendagri } from '@/lib/formatters';
import SafeImage from '@/components/SafeImage';

interface ThemeProps {
  tenant: ResolvedTenant;
  data: {
    articles: any[];
    announcements: any[];
    officials: any[];
    apbdes: any[];
  };
}

export default function TraditionalVillageTheme({ tenant, data }: ThemeProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalPendapatan = data.apbdes
    .filter((i) => i.category === 'Pendapatan')
    .reduce((sum, curr) => sum + curr.realization, 0);

  const totalBelanja = data.apbdes
    .filter((i) => i.category === 'Belanja')
    .reduce((sum, curr) => sum + curr.realization, 0);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-900 font-sans antialiased selection:bg-amber-800 selection:text-amber-100">
      {/* 1. Pita Kehormatan Tradisi & Wilayah */}
      <div className="bg-[#3b1d11] text-amber-200 text-xs py-2.5 px-4 sm:px-8 border-b border-amber-950/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-amber-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Kec. {tenant.kecamatan}, Kab. {tenant.kabupaten}, Prov. {tenant.provinsi}
            </span>
            <span className="hidden md:inline text-amber-700">•</span>
            <span className="hidden md:inline text-amber-300/80 font-mono text-[11px]">
              Kode Wilayah: {formatKodeKemendagri(tenant.kodeDesa)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-amber-950/80 text-amber-300 border border-amber-800/80 px-3 py-0.5 rounded-full text-[11px] font-semibold">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              Kearifan Lokal & Harmoni Kemasyarakatan
            </span>
          </div>
        </div>
      </div>

      {/* 2. Header Nuansa Kayu & Etnik Nusantara */}
      <header className="sticky top-0 z-40 bg-[#fdfbf7]/95 backdrop-blur-md shadow-sm border-b border-amber-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href={`/?tenant=${tenant.slug}`} className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl bg-[#592a17] text-amber-200 flex items-center justify-center shadow-md shadow-amber-950/20 ring-2 ring-amber-300/50 group-hover:scale-105 transition-transform">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-800 block">
                Pemerintah Desa
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-[#3b1d11] group-hover:text-amber-800 transition">
                Desa {tenant.namaDesa}
              </h1>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-700">
            <Link href="#profil" className="hover:text-amber-900 transition">Kearifan & Visi</Link>
            <Link href="#layanan" className="hover:text-amber-900 transition">Layanan Warga</Link>
            <Link href="#warta" className="hover:text-amber-900 transition">Warta Desa</Link>
            <Link href="#pamong" className="hover:text-amber-900 transition">Pamong Desa</Link>
            <Link href="#keuangan" className="hover:text-amber-900 transition">Transparansi Dana</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="bg-[#592a17] hover:bg-[#431f11] text-amber-100 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition"
            >
              Balai Admin
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section dengan Foto Dokumentasi Arsitektur/Budaya Nyata */}
      <section className="relative min-h-[540px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url(${tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg'})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#29120a]/95 via-[#29120a]/80 to-[#29120a]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#29120a] via-transparent to-transparent opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-amber-50">
            <div className="inline-flex items-center gap-2 bg-amber-950/60 border border-amber-400/40 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Menjaga Tradisi, Menggerakkan Kemakmuran Warga
            </div>

            <div className="space-y-2">
              <p className="text-amber-300 font-extrabold uppercase tracking-widest text-xs sm:text-sm">
                Tabe&apos; & Salam Hangat
              </p>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight">
                Pemerintah Desa {tenant.namaDesa}
              </h2>
            </div>

            <p className="text-amber-100/90 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              {tenant.visi || 'Mewujudkan masyarakat desa yang guyub rukun, makmur berdikari, dan luhur budi pekerti.'}
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link
                href="#warta"
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-950/30 transition flex items-center gap-2 text-sm"
              >
                <span>Warta & Agenda Desa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#layanan"
                className="bg-white/10 hover:bg-white/20 text-amber-100 font-bold px-6 py-3.5 rounded-2xl border border-amber-300/30 backdrop-blur-md transition text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Layanan Mandiri Warga</span>
              </Link>
            </div>
          </div>

          {/* Profil Kepala Desa / Sambutan Pamong */}
          <div className="lg:col-span-5 bg-[#fdfbf7] text-stone-900 rounded-xl p-6 sm:p-7 shadow-2xl border border-amber-200">
            <div className="flex items-center gap-4 pb-4 border-b border-amber-200">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-md border-2 border-amber-700 flex-shrink-0">
                <SafeImage
                  src="/images/kades_portrait.jpg"
                  fallbackSrc="/images/kades_portrait.jpg"
                  alt={tenant.kepalaDesa || 'Kepala Desa'}
                  fill
                  priority
                  sizes="(max-width: 640px) 80px, 96px"
                  className="object-cover object-top"
                />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 inline-block mb-1">
                  Kepala Desa
                </span>
                <h3 className="text-base sm:text-lg font-serif font-black text-amber-950 leading-tight">
                  {tenant.kepalaDesa || 'I Nyoman Sukerta, S.Pd.'}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Pemimpin & Pengayom Warga</p>
                <p className="text-[10px] font-mono text-amber-800 font-semibold mt-0.5">Kec. {tenant.kecamatan}, Kab. {tenant.kabupaten}</p>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs leading-relaxed text-stone-700">
              <p className="italic text-stone-600 font-serif">
                &ldquo;Kerukunan dan gotong-royong adalah pondasi kemakmuran desa kami. Portal resmi ini hadir menjaga transparansi anggaran dan mempermudah layanan bagi seluruh lapisan masyarakat.&rdquo;
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block text-[10px] font-bold">Basis Wilayah</span>
                  <span className="font-bold text-stone-900">{tenant.kabupaten}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block text-[10px] font-bold">Gaya Budaya</span>
                  <span className="font-bold text-stone-900">Traditional Village</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Layanan Mandiri Warga Desa (Citizen Services) */}
      <section id="layanan" className="max-w-7xl mx-auto px-4 sm:px-8 py-10 -mt-8 relative z-20">
        <div className="bg-white rounded-xl border border-amber-200 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-5">
            <div>
              <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Pelayanan Terpadu</span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-950 mt-1">Layanan Surat & Administrasi Mandiri</h3>
            </div>
            <span className="text-xs text-stone-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Cepat • Transparan • Tanpa Pungli
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { title: 'Surat Keterangan Usaha (SKU)', desc: 'Persyaratan UMKM & bantuan permodalan desa', tag: 'UMKM' },
              { title: 'Surat Pengantar KTP / KK', desc: 'Permohonan dokumen kependudukan Catil', tag: 'Dukcapil' },
              { title: 'Surat Keterangan Domisili', desc: 'Bukti domisili tempat tinggal warga / badan', tag: 'Kependudukan' },
              { title: 'Surat Keterangan Tidak Mampu', desc: 'Pengantar beasiswa & jaminan kesehatan', tag: 'Bansos' },
            ].map((srv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-100/60 border border-amber-200/80 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full inline-block mb-2">
                    {srv.tag}
                  </span>
                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-amber-900 transition leading-snug">
                    {srv.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-amber-200/50 flex items-center gap-1 text-[11px] font-bold text-amber-800">
                  <span>Ajukan Surat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-16">
        
        {/* Visi & Misi Kearifan */}
        <section id="profil" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#431f11] text-amber-100 rounded-xl p-8 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Amanah Warga</span>
              <h3 className="text-2xl font-serif font-black mt-2 mb-3 text-amber-50">Visi Pembangunan</h3>
              <p className="text-amber-100/90 text-sm italic font-serif leading-relaxed">
                &ldquo;{tenant.visi}&rdquo;
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-amber-800/80 flex items-center gap-2 text-xs text-amber-300">
              <HeartHandshake className="w-4 h-4" />
              <span>Musyawarah Rencana Pembangunan Desa (Musrenbangdes)</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl p-8 border border-amber-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest text-amber-800 uppercase">Misi & Agenda Pokok</span>
              <h3 className="text-2xl font-serif font-black text-amber-950 mt-2 mb-4">Langkah Pengabdian Pamong Desa</h3>
              <div className="space-y-3.5">
                {tenant.misi.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 text-sm text-stone-700">
                    <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5 border border-amber-300">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed pt-0.5">{m}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Kabar Berita dan Maklumat Warga */}
        <section id="warta" className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-amber-200 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-800 tracking-widest uppercase">Warta & Dokumentasi Lapangan</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-950 mt-1">Kabar Pembangunan Desa</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Daftar Artikel dengan Foto Autentik */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.articles.map((art) => (
                <article key={art.id} className="bg-white rounded-xl border border-amber-200/90 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col group">
                  <div className="relative h-48 overflow-hidden bg-stone-100">
                    <SafeImage
                      src={art.coverImageUrl}
                      fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                      alt={art.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#3b1d11]/85 text-amber-200 text-[11px] font-bold px-3 py-1 rounded-full shadow backdrop-blur-sm border border-amber-700/50">
                      {art.category?.name || 'Kabar Desa'}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-amber-700" />
                          {art.viewCount} Pembaca
                        </span>
                      </div>
                      <h4 className="font-serif font-black text-lg text-amber-950 group-hover:text-amber-800 transition leading-snug">
                        <Link href={`/berita/${art.slug}?tenant=${tenant.slug}`}>
                          {art.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">{art.authorName || art.author?.name || 'Pamong Desa'}</span>
                      <Link
                        href={`/berita/${art.slug}?tenant=${tenant.slug}`}
                        className="text-amber-900 font-bold flex items-center gap-1 hover:underline"
                      >
                        Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}

              {data.articles.length === 0 && (
                <div className="sm:col-span-2 p-12 text-center bg-white border border-amber-200 rounded-xl text-stone-500">
                  Belum ada warta yang diterbitkan.
                </div>
              )}
            </div>

            {/* Papan Pengumuman Adat */}
            <div id="pengumuman" className="lg:col-span-4 bg-white rounded-xl border border-amber-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2 text-amber-950 font-black text-base font-serif">
                  <Megaphone className="w-5 h-5 text-amber-700" />
                  Maklumat & Pengumuman
                </div>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {data.announcements.filter((ann: any) => !ann.expiresAt || new Date(ann.expiresAt).getTime() >= Date.now()).length} Maklumat
                </span>
              </div>

              <div className="space-y-3">
                {data.announcements
                  .filter((ann: any) => !ann.expiresAt || new Date(ann.expiresAt).getTime() >= Date.now())
                  .slice(0, 2)
                  .map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-stone-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-amber-700" />
                      {formatAnnouncementDateTime(ann.createdAt, tenant?.provinsi)}
                    </span>
                    <h5 className="font-bold text-sm text-amber-950 leading-snug">{ann.title}</h5>
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{ann.content}</p>
                  </div>
                ))}
                {data.announcements.filter((ann: any) => !ann.expiresAt || new Date(ann.expiresAt).getTime() >= Date.now()).length === 0 && (
                  <p className="text-xs text-stone-400 italic text-center py-6">Belum ada maklumat baru.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tetua & Aparatur Pamong */}
        <section id="pamong" className="space-y-6">
          <div className="border-b border-amber-200 pb-4">
            <span className="text-xs font-bold text-amber-800 tracking-widest uppercase">Pamong Pengayom</span>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-950 mt-1">Aparatur Pemerintahan Desa</h3>
            <p className="text-xs text-stone-500 mt-0.5">Perangkat pelayan warga Desa {tenant.namaDesa}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {data.officials.map((ofc) => {
              const att = ofc.attendances && ofc.attendances[0];
              return (
                <div key={ofc.id} className="bg-white rounded-xl border border-amber-200 p-6 text-center shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    {ofc.photoUrl ? (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-md border-2 border-amber-700/40 mb-3.5">
                        <SafeImage
                          src={ofc.photoUrl}
                          fallbackSrc="/images/kades_portrait.jpg"
                          alt={ofc.name}
                          fill
                          sizes="80px"
                          className="object-cover object-top"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-[#592a17] text-amber-100 font-serif font-black text-2xl mx-auto flex items-center justify-center shadow-md shadow-amber-950/20 mb-3.5">
                        {ofc.name.charAt(0)}
                      </div>
                    )}
                    <h5 className="font-bold text-sm text-stone-900 leading-snug">{ofc.name}</h5>
                    <span className="inline-block bg-amber-50 text-amber-900 text-[11px] font-bold px-3 py-0.5 rounded-full mt-2 border border-amber-200">
                      {ofc.position}
                    </span>
                    {ofc.nip && <p className="text-[10px] font-mono text-stone-400 mt-1.5">NIP. {ofc.nip}</p>}
                  </div>

                  {/* Status Presensi Hari Ini */}
                  <div className="mt-3.5 pt-3 border-t border-amber-100 flex flex-col items-center">
                    {att?.status === 'HADIR' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-full justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Hadir Melayani
                      </span>
                    )}
                    {att?.status === 'TERLAMBAT' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-full justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        Hadir (Terlambat)
                      </span>
                    )}
                    {att?.status === 'DINAS_LUAR' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 w-full justify-center" title={att.notes || 'Dinas Luar'}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        Dinas Luar
                      </span>
                    )}
                    {(att?.status === 'IZIN' || att?.status === 'SAKIT') && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 w-full justify-center">
                        {att.status === 'IZIN' ? 'Izin' : 'Sakit'}
                      </span>
                    )}
                    {(!att || att?.status === 'ALFA') && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-stone-500 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200 w-full justify-center">
                        Belum Absen
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Transparansi Dana Desa APBDes */}
        <section id="keuangan" className="bg-[#3b1d11] rounded-xl p-8 sm:p-10 text-amber-50 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/80 pb-5">
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Akuntabilitas Keuangan
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-black mt-1">Transparansi Dana Desa {tenant.namaDesa}</h3>
            </div>
            <div className="flex items-center gap-6 text-xs bg-[#29120a] p-3 rounded-2xl border border-amber-900">
              <div>
                <span className="text-amber-300/70 block">Pendapatan:</span>
                <span className="text-amber-300 font-extrabold text-base">{formatRupiah(totalPendapatan)}</span>
              </div>
              <div className="border-l border-amber-900 pl-6">
                <span className="text-amber-300/70 block">Belanja:</span>
                <span className="text-amber-200 font-extrabold text-base">{formatRupiah(totalBelanja)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.apbdes.map((item) => {
              const pct = item.budget > 0 ? Math.min(100, Math.round((item.realization / item.budget) * 100)) : 0;
              return (
                <div key={item.id} className="bg-[#4d2616] border border-amber-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <span className="text-amber-300/80 font-mono text-[10px] block">{item.accountCode} • {item.category}</span>
                      <h6 className="font-bold text-amber-100 text-sm mt-0.5">{item.accountName}</h6>
                    </div>
                    <span className="font-bold text-amber-200 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-700 text-xs">
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-[#29120a] rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-amber-300/80">
                    <span>Anggaran: <strong className="text-amber-100">{formatRupiah(item.budget)}</strong></span>
                    <span>Terserap: <strong className="text-amber-300">{formatRupiah(item.realization)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* 6. Footer Adat */}
      <footer className="bg-[#29120a] text-amber-200/70 text-xs border-t border-amber-950 py-12 px-4 sm:px-8 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-amber-100 font-serif font-black text-xl flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              Pemerintah Desa {tenant.namaDesa}
            </div>
            <p className="leading-relaxed">
              {tenant.alamatKantor || 'Kantor Desa ' + tenant.namaDesa + ', Kec. ' + tenant.kecamatan + ', Kab. ' + tenant.kabupaten}
            </p>
          </div>
          <div className="space-y-3">
            <h5 className="text-amber-200 font-bold uppercase tracking-wider text-xs">Pelayanan Pamong</h5>
            <div className="space-y-1.5 text-amber-300/80">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-amber-400" /> {tenant.email || 'kontak@desa.id'}</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-amber-400" /> {tenant.telepon || '-'}</p>
              <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-400" /> Senin - Jumat (08:00 - 15:30 {getTimezoneByProvince(tenant.provinsi)})</p>
            </div>
          </div>
          <div className="space-y-3">
            <h5 className="text-amber-200 font-bold uppercase tracking-wider text-xs">Identitas & Kedaulatan Desa</h5>
            <p className="leading-relaxed text-amber-300/60">
              Platform multi-tenant mandiri yang memelihara identitas kultural dan kebhinekaan desa di nusantara.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-amber-950 mt-10 pt-6 flex flex-col sm:flex-row justify-between text-amber-400/60 text-[11px]">
          <span>© 2026 Pemerintah Desa {tenant.namaDesa}. Seluruh hak cipta dilindungi undang-undang.</span>
          <span className="font-mono">Tema: Traditional Village • Multi-Tenant SaaS</span>
        </div>
      </footer>
    </div>
  );
}
