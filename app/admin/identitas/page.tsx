'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Play,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Video,
  Image as ImageIcon,
  AlertCircle,
  Award,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { maskKodeKemendagriInput, formatKodeKemendagri } from '@/lib/formatters';

export default function IdentitasDesaPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    namaDesa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: '',
    kodeDesa: '',
    kodePos: '',
    alamatKantor: '',
    telepon: '',
    email: '',
    logoUrl: '',
    visi: '',
    visiPeriode: '2026-2031',
    misi: [] as string[],
    socialMedia: {
      whatsapp: '',
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: '',
      twitter: '',
    },
  });

  // Fetch current data
  const fetchIdentity = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await fetch(`/api/identity?tenant=${currentTenantId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFormData({
          namaDesa: json.data.namaDesa || '',
          kecamatan: json.data.kecamatan || '',
          kabupaten: json.data.kabupaten || '',
          provinsi: json.data.provinsi || '',
          kodeDesa: json.data.kodeDesa || '',
          kodePos: json.data.kodePos || '',
          alamatKantor: json.data.alamatKantor || '',
          telepon: json.data.telepon || '',
          email: json.data.email || '',
          logoUrl: json.data.logoUrl || '',
          visi: json.data.visi || '',
          visiPeriode: json.data.visiPeriode || '2026-2031',
          misi: Array.isArray(json.data.misi) && json.data.misi.length > 0
            ? json.data.misi
            : [
                'Meningkatkan tata kelola pemerintahan desa yang bersih, transparan, dan profesional.',
                'Mengembangkan potensi ekonomi dan pertanian berkelanjutan berbasis kearifan lokal.',
                'Meningkatkan kualitas infrastruktur pedesaan dan pelayanan publik terpadu.',
                'Melestarikan adat, budaya, dan kerukunan warga masyarakat desa.',
              ],
          socialMedia: {
            whatsapp: json.data.socialMedia?.whatsapp || '',
            facebook: json.data.socialMedia?.facebook || '',
            instagram: json.data.socialMedia?.instagram || '',
            youtube: json.data.socialMedia?.youtube || '',
            tiktok: json.data.socialMedia?.tiktok || '',
            twitter: json.data.socialMedia?.twitter || '',
          },
        });
      }
    } catch (e: any) {
      console.error('Gagal mengambil identitas desa:', e);
      setErrorMessage('Gagal memuat data identitas desa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchIdentity();
  }, [currentTenantId]);

  const addMisiItem = () => {
    setFormData((prev) => ({
      ...prev,
      misi: [...prev.misi, ''],
    }));
  };

  const updateMisiItem = (index: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.misi];
      updated[index] = val;
      return { ...prev, misi: updated };
    });
  };

  const removeMisiItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      misi: prev.misi.filter((_, i) => i !== index),
    }));
  };

  const moveMisiItem = (index: number, dir: 'up' | 'down') => {
    setFormData((prev) => {
      const updated = [...prev.misi];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[target];
      updated[target] = temp;
      return { ...prev, misi: updated };
    });
  };

  // Handle Logo Upload (Image or WebM/MP4 Animation)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'identitas');
      if (activeTenant?.slug) {
        data.append('tenant', activeTenant.slug);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (res.ok && json.url) {
        setFormData((prev) => ({ ...prev, logoUrl: json.url }));
      } else {
        alert(json.error || 'Gagal mengunggah berkas logo');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat mengunggah: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);
      setErrorMessage('');

      const res = await fetch(`/api/identity?tenant=${currentTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(json.error || 'Gagal menyimpan perubahan');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const isVideoLogo =
    formData.logoUrl &&
    (formData.logoUrl.endsWith('.webm') ||
      formData.logoUrl.endsWith('.mp4') ||
      formData.logoUrl.includes('webm') ||
      formData.logoUrl.includes('mp4'));

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Pengaturan Profil Desa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Identitas, Logo & Kontak Desa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Perbarui logo resmi (foto atau animasi WebM), kontak pelayanan, dan media sosial Desa{' '}
            <strong className="text-slate-800 dark:text-slate-200">{formData.namaDesa || currentTenantId}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            suppressHydrationWarning
            href={mounted && currentTenantId ? `/?tenant=${currentTenantId}` : '/'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition shadow-sm"
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Lihat Website</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm flex items-center gap-3 shadow-sm animate-in fade-in-50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <strong>Berhasil disimpan!</strong> Logo desa, kontak, dan tautan media sosial telah diperbarui secara langsung di website portal publik.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: LOGO DESA (FOTO ATAU VIDEO ANIMASI WEBM) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Logo Resmi Desa & Lambang Daerah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dukung format foto (PNG, JPG, WebP, SVG) serta video animasi bergerak (.webm, .mp4).
                </p>
              </div>
            </div>
            {isVideoLogo && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                <Video className="w-3.5 h-3.5" />
                <span>Format Animasi WebM Aktif</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Live Logo Preview Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Pratinjau Logo di Website
              </span>
              <div className="w-32 h-32 flex items-center justify-center p-2 relative group">
                {formData.logoUrl ? (
                  isVideoLogo ? (
                    <video
                      src={formData.logoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Desa"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <Building2 className="w-12 h-12 text-slate-300" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-3 truncate max-w-[200px]">
                {formData.namaDesa ? `Desa ${formData.namaDesa}` : 'Pemerintah Desa'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isVideoLogo ? 'Video Animasi WebM' : 'Gambar / Foto Statis'}
              </span>
            </div>

            {/* Input Controls */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  URL Berkas Logo Desa
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://... atau /uploads/logo.webm"
                    className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-200 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Masukkan tautan langsung gambar atau animasi (contoh: <code>https://dpmd-mateng.adit.lt/logo.webm</code>).
                </p>
              </div>

              {/* Upload Button & Preset */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{uploading ? 'Mengunggah...' : 'Unggah Berkas Baru (Foto/WebM)'}</span>
                  <input
                    type="file"
                    accept="image/*,video/webm,video/mp4"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: KONTAK & ALAMAT KANTOR DESA */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Kontak Pelayanan & Alamat Kantor Balai Desa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Informasi ini ditampilkan pada bilah atas (top bar) dan kaki halaman (footer) website desa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Nomor Telepon Kantor / Layanan
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="081241977475 atau 021-123456"
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-200 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Alamat Email Resmi Desa
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={activeTenant ? `kontak@${activeTenant.slug}.desa.id` : 'kontak@desa.id'}
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Alamat Lengkap Kantor Balai Desa
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={formData.alamatKantor}
                  onChange={(e) => setFormData({ ...formData, alamatKantor: e.target.value })}
                  placeholder={activeTenant ? `Kantor Balai Desa ${activeTenant.nama_desa}...` : 'Alamat kantor balai desa...'}
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Kode Wilayah Kemendagri
                </label>
                <span className="text-[10px] text-slate-400 font-mono">PP.KK.CC.2XXX</span>
              </div>
              <input
                type="text"
                value={formData.kodeDesa}
                onChange={(e) => setFormData({ ...formData, kodeDesa: maskKodeKemendagriInput(e.target.value) })}
                placeholder="Contoh: 76.06.04.2009"
                maxLength={13}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Kode Pos
              </label>
              <input
                type="text"
                value={formData.kodePos}
                onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                placeholder="91564"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 dark:text-slate-200 transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: KANAL MEDIA SOSIAL RESMI */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Kanal Media Sosial Resmi Desa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tautan media sosial yang tampil pada header dan footer tema website untuk memudahkan interaksi warga.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                WhatsApp Pelayanan Warga (Nomor / Tautan Chat)
              </label>
              <input
                type="text"
                value={formData.socialMedia.whatsapp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, whatsapp: e.target.value },
                  })
                }
                placeholder="081241977475 atau https://wa.me/6281241977475"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* Facebook */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Halaman Facebook Resmi
              </label>
              <input
                type="text"
                value={formData.socialMedia.facebook}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value },
                  })
                }
                placeholder={activeTenant ? `https://facebook.com/desa.${activeTenant.slug}` : 'https://facebook.com/desa.resmi'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Akun Instagram Desa
              </label>
              <input
                type="text"
                value={formData.socialMedia.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value },
                  })
                }
                placeholder={activeTenant ? `https://instagram.com/desa_${activeTenant.slug}` : 'https://instagram.com/desa_resmi'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Saluran YouTube Desa
              </label>
              <input
                type="text"
                value={formData.socialMedia.youtube}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, youtube: e.target.value },
                  })
                }
                placeholder={activeTenant ? `https://youtube.com/@Desa${activeTenant.nama_desa.replace(/\s+/g, '')}` : 'https://youtube.com/@DesaResmi'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Akun TikTok Desa
              </label>
              <input
                type="text"
                value={formData.socialMedia.tiktok}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, tiktok: e.target.value },
                  })
                }
                placeholder={activeTenant ? `https://tiktok.com/@desa${activeTenant.slug}` : 'https://tiktok.com/@desaresmi'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>

            {/* Twitter / X */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Akun Twitter / X
              </label>
              <input
                type="text"
                value={formData.socialMedia.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value },
                  })
                }
                placeholder={activeTenant ? `https://x.com/desa${activeTenant.slug}` : 'https://x.com/desaresmi'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: VISI DESA & AGENDA STRATEGIS MISI KERJA */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Visi Desa & Agenda Strategis Misi Kerja
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rumusan visi kepemimpinan dan butir misi kerja pemerintah desa yang tampil di halaman beranda.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Periode Visi */}
            <div className="max-w-xs">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Periode Masa Bhakti Visi:
              </label>
              <input
                type="text"
                value={formData.visiPeriode}
                onChange={(e) => setFormData({ ...formData, visiPeriode: e.target.value })}
                placeholder="2026-2031"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 font-semibold transition"
              />
            </div>

            {/* Rumusan Visi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Rumusan Visi Pembangunan Desa:
              </label>
              <textarea
                rows={3}
                value={formData.visi}
                onChange={(e) => setFormData({ ...formData, visi: e.target.value })}
                placeholder={activeTenant ? `Mewujudkan Desa ${activeTenant.nama_desa} yang Maju, Mandiri, Berbudaya, dan Sejahtera...` : 'Mewujudkan Desa yang Maju, Mandiri, Berbudaya, dan Sejahtera...'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 leading-relaxed transition"
              />
            </div>

            {/* Daftar Butir Misi Kerja */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Butir-Butir Agenda Misi Kerja ({formData.misi.length} Butir)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Agenda strategis yang dijalankan pemerintah desa untuk mewujudkan visi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMisiItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Butir Misi</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {formData.misi.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={m}
                      onChange={(e) => updateMisiItem(idx, e.target.value)}
                      placeholder={`Butir misi ${idx + 1}...`}
                      className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                    />
                    <div className="flex items-center gap-1 shrink-0 mt-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveMisiItem(idx, 'up')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                        title="Naikkan"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === formData.misi.length - 1}
                        onClick={() => moveMisiItem(idx, 'down')}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                        title="Turunkan"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMisiItem(idx)}
                        className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300"
                        title="Hapus Butir Misi"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-700/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Identitas & Kontak'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
