'use client'

import { useRef, useState, useEffect } from 'react';
import { submitReimbursement, getClaimForEdit, updateReimbursement, getClaimDetail } from '@/app/actions/reimbursement';
import { getTechnicianStats, getTechnicianClaims, ClaimHistory } from '@/app/actions/stats';
import { getCurrentUser } from '@/app/actions/user';
import { getAllCategories } from '@/app/actions/categories';
import LogoutButton from '@/app/components/LogoutButton';
import VandizaBrand from '@/app/components/VandizaBrand';
import Link from 'next/link';
import { upload } from '@vercel/blob/client';
import { User, Wrench, IdCard, Smartphone, FileText, BarChart2, List, CheckCircle2, AlertTriangle, Receipt, Plus, Camera, Send, Calendar, Clock, Building, XCircle, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';



type Category = { id: string, name: string };
type UserProfile = { name: string; nik: string | null; position: string | null; phone: string | null };

// Array Bulan untuk Filter Format Baru
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function SubmitPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // [BARU] State Navigasi Tab (form, stats, atau history)
  const [activeTab, setActiveTab] = useState<'form' | 'stats' | 'history'>('form');


  // State untuk menyimpan Bulan Filter (Default: Bulan Ini 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // State Metrik & Profil
  const [stats, setStats] = useState({ pending: 0, approved: 0, paid: 0, queuePosition: 0 });
  const [profile, setProfile] = useState<UserProfile>({ name: "Memuat...", nik: "-", position: "-", phone: "-" });
  const [categories, setCategories] = useState<Category[]>([]);

  // [BARU] State untuk Riwayat Klaim
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);


  // State tracking file
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<(File | null)[]>([null, null, null]);
  const [compressedReceipt, setCompressedReceipt] = useState<File | null>(null);
  const [compressedEvidence, setCompressedEvidence] = useState<(File | null)[]>([null, null, null]);

  // [BARU] State untuk Modal Edit Klaim
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);

  // [BARU] State untuk Detail Modal Klaim (Riwayat)
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((data) => { if (data) setProfile(data as UserProfile); });
    getAllCategories().then((result) => { if (result.success && result.categories) setCategories(result.categories); });
  }, []);

  // Fetch Metrik dijalankan saat halaman dimuat ATAU saat selectedMonth berubah
  useEffect(() => {
    getTechnicianStats(selectedMonth).then((data) => { if (data) setStats(data); });
  }, [selectedMonth]);

  // [BARU] Fetch Riwayat Klaim saat tab history aktif atau bulan berubah
  useEffect(() => {
    if (activeTab === 'history') {
      setClaimsLoading(true);
      getTechnicianClaims(selectedMonth).then((data) => {
        if (data) setClaims(data);
        setClaimsLoading(false);
      });
    }
  }, [activeTab, selectedMonth]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Memproses unggahan foto... ⏳');

    try {
      const form = e.currentTarget;

      // 1. Validasi Kehadiran File Wajib
      if (!compressedReceipt || !compressedEvidence[0] || !compressedEvidence[1]) {
        throw new Error("Mohon lengkapi Foto Struk dan minimal 2 Bukti Lapangan wajib.");
      }

      // 2. Fungsi bantuan untuk upload langsung ke Blob
      const uploadToBlob = async (file: File, prefix: string) => {
        const safeName = `${prefix}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const newBlob = await upload(safeName, file, {
          access: 'public',
          handleUploadUrl: '/api/upload', // Otorisasi API yang kita buat sebelumnya
        });
        return newBlob.url;
      };

      // 3. Upload File Secara Paralel
      const uploadPromises = [
        uploadToBlob(compressedReceipt, 'receipt'),
        uploadToBlob(compressedEvidence[0], 'ev1'),
        uploadToBlob(compressedEvidence[1], 'ev2')
      ];

      // Jika ada eviden ke-3 (opsional)
      if (compressedEvidence[2]) {
        uploadPromises.push(uploadToBlob(compressedEvidence[2], 'ev3'));
      }

      const urls = await Promise.all(uploadPromises);

      toast.loading('Menyimpan data laporan... 💾', { id: toastId });

      // 4. Siapkan Data untuk Server Action (HANYA MENGIRIM TEKS)
      const formData = new FormData();
      formData.append('amount', (form.elements.namedItem('amount') as HTMLInputElement).value);
      formData.append('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value);
      formData.append('categoryId', (form.elements.namedItem('categoryId') as HTMLSelectElement).value);
      formData.append('expenseDate', (form.elements.namedItem('expenseDate') as HTMLInputElement).value);

      const kmBeforeEl = form.elements.namedItem('kmBefore') as HTMLInputElement;
      if (kmBeforeEl && kmBeforeEl.value) formData.append('kmBefore', kmBeforeEl.value);

      const kmAfterEl = form.elements.namedItem('kmAfter') as HTMLInputElement;
      if (kmAfterEl && kmAfterEl.value) formData.append('kmAfter', kmAfterEl.value);

      const vehiclePlateEl = form.elements.namedItem('vehiclePlate') as HTMLInputElement;
      if (vehiclePlateEl && vehiclePlateEl.value) formData.append('vehiclePlate', vehiclePlateEl.value);

      // SINKRONISASI DATA: Kirim URL yang didapat dari Blob
      formData.append('receiptUrl', urls[0]);
      formData.append('evidence1Url', urls[1]);
      formData.append('evidence2Url', urls[2]);
      if (urls[3]) formData.append('evidence3Url', urls[3]);

      // 5. Eksekusi Server Action
      const result = await submitReimbursement(formData);

      if (result.success) {
        toast.success(result.message, { id: toastId });
        formRef.current?.reset();
        setReceiptFile(null);
        setEvidenceFiles([null, null, null]);
        setCompressedReceipt(null);
        setCompressedEvidence([null, null, null]);

        // Pindah otomatis ke tab statistik
        setActiveTab('stats');
        getTechnicianStats(selectedMonth).then((data) => { if (data) setStats(data); });
      } else {
        toast.error(result.message, { id: toastId });
      }

    } catch (error: any) {
      console.error("Submit Error:", error);
      toast.error(error.message || '⚠️ Gagal mengirim laporan. Pastikan koneksi stabil.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Kompresi Gambar Client-Side
  const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file) {
      try { setCompressedReceipt(await compressImage(file)); }
      catch { setCompressedReceipt(file); }
    } else setCompressedReceipt(null);
  };

  const handleEvidenceChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] || null;
    const newFiles = [...evidenceFiles];
    newFiles[index] = file;
    setEvidenceFiles(newFiles);

    if (file) {
      try {
        const compressed = await compressImage(file);
        const newCompressed = [...compressedEvidence];
        newCompressed[index] = compressed;
        setCompressedEvidence(newCompressed);
      } catch {
        const newCompressed = [...compressedEvidence];
        newCompressed[index] = file;
        setCompressedEvidence(newCompressed);
      }
    } else {
      const newCompressed = [...compressedEvidence];
      newCompressed[index] = null;
      setCompressedEvidence(newCompressed);
    }
  };

  // Parsing Filter Bulan Premium (Januari | 2026)
  const [selYear, selMonth] = selectedMonth.split('-');
  const selectedMonthName = MONTHS[parseInt(selMonth, 10) - 1];

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans pb-12">

      {/* HEADER */}
      <header className="bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-20 border-b border-white/5 shadow-2xl px-5 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">Ops<span className="text-indigo-400">Claim</span></h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Sistem Operasional</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <button className="flex items-center justify-center p-2.5 bg-slate-900/50 backdrop-blur-md hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-xl transition-all duration-300 border border-white/5 hover:border-indigo-500/30 shadow-sm active:scale-95" title="Profil Saya">
              <User className="w-5 h-5" />
            </button>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 md:py-8 flex justify-center w-full">
        <div className="w-full max-w-lg space-y-6">

          {/* KARTU PROFIL TEKNISI */}
          <div className="bg-slate-900/40 rounded-[2rem] p-6 shadow-2xl border border-white/5 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner flex-shrink-0">
                <Wrench className="w-8 h-8 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-extrabold text-white truncate">{profile.name}</h2>
                <p className="text-sm font-bold text-indigo-400 truncate">{profile.position || 'Teknisi Lapangan'}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><span className="text-slate-500"><IdCard className="w-4 h-4" /></span> {profile.nik || '-'}</span>
                  <span className="flex items-center gap-1"><span className="text-slate-500"><Smartphone className="w-4 h-4" /></span> {profile.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGASI (SEGMENTED CONTROL) */}
          <div className="flex bg-slate-950/50 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center ${activeTab === 'form' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <FileText className="w-4 h-4 mr-1.5" /> Klaim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center ${activeTab === 'stats' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <BarChart2 className="w-4 h-4 mr-1.5" /> Statistik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center ${activeTab === 'history' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            >
              <List className="w-4 h-4 mr-1.5" /> Riwayat
            </button>
          </div>


          {/* NOTIFIKASI */}
          {/* Old alert box removed in favor of floating toast */}



          {/* ---------------------------------------------------- */}
          {/* KONTEN TAB 1: FORM KLAIM BARU                          */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'form' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-2 mb-5">
                <h3 className="text-2xl font-black text-white tracking-tight">Formulir Klaim</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Isi detail dan unggah 4 foto wajib.</p>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-white/5 backdrop-blur-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="categoryId" className="block text-sm font-bold text-slate-400 ml-1">Kategori</label>
                    <select id="categoryId" name="categoryId" required disabled={loading} className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all cursor-pointer disabled:opacity-50">
                      <option value="">Pilih...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="expenseDate" className="block text-sm font-bold text-slate-400 ml-1">Tgl Nota</label>
                    <input type="date" id="expenseDate" name="expenseDate" required disabled={loading} className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all dark-date-picker disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="amount" className="block text-sm font-bold text-slate-400 ml-1">Nominal Pengeluaran (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><span className="text-slate-500 font-extrabold">Rp</span></div>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }} id="amount" name="amount" required disabled={loading} placeholder="0" className="w-full pl-12 pr-5 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-indigo-400 font-black text-xl outline-none transition-all placeholder:text-slate-600 placeholder:font-normal disabled:opacity-50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-bold text-slate-400 ml-1">Deskripsi Pekerjaan / Nomer Tiket</label>
                  <textarea id="description" name="description" required rows={2} disabled={loading} placeholder="Contoh: Beli bensin untuk tiket #12345..." className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all resize-none placeholder:text-slate-600 placeholder:font-normal disabled:opacity-50"></textarea>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="vehiclePlate" className="block text-sm font-bold text-slate-400 ml-1">Plat Kendaraan</label>
                  <input type="text" id="vehiclePlate" name="vehiclePlate" disabled={loading} placeholder="Contoh: B 1234 XYZ" className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all placeholder:text-slate-600 placeholder:font-normal disabled:opacity-50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="kmBefore" className="block text-sm font-bold text-slate-400 ml-1">KM Sebelum</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }} id="kmBefore" name="kmBefore" disabled={loading} placeholder="0" className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white font-black text-lg outline-none transition-all placeholder:text-slate-600 placeholder:font-normal disabled:opacity-50" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="kmAfter" className="block text-sm font-bold text-slate-400 ml-1">KM Sesudah</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }} id="kmAfter" name="kmAfter" disabled={loading} placeholder="0" className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md focus:bg-black/40 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white font-black text-lg outline-none transition-all placeholder:text-slate-600 placeholder:font-normal disabled:opacity-50" />
                  </div>
                </div>

                <div className="w-full h-px bg-white/5 my-4"></div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-white ml-1">1. Foto Bon/Struk <span className="text-rose-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 ${receiptFile ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-inner'}`}>
                    <input type="file" id="receipt" name="receipt" accept="image/*" required disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" onChange={handleReceiptChange} />
                    <div className={`w-14 h-14 rounded-full shadow-inner border mb-3 flex items-center justify-center transition-all duration-300 ${receiptFile ? 'bg-emerald-500/20 border-emerald-400 scale-110' : 'bg-black/40 border-white/10 group-hover:scale-110 group-hover:border-indigo-400/50'}`}>
                      {receiptFile ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Receipt className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />}
                    </div>
                    <p className={`text-sm font-bold ${receiptFile ? 'text-emerald-400' : 'text-indigo-400'}`}>{receiptFile ? receiptFile.name : 'Ketuk untuk pilih Struk'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-bold text-white ml-1 mb-2">2. Foto Bukti Lapangan <span className="text-rose-500 text-xs font-normal ml-1">(2 Wajib, 1 Opsional)</span></label>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { id: 1, label: 'KM Sebelum', req: true },
                      { id: 2, label: 'KM Sesudah', req: true },
                      { id: 3, label: 'Eviden Tmbh', req: false }
                    ].map((item) => (
                      <div key={item.id} className={`relative border-2 ${item.req ? 'border-dashed' : 'border-dotted'} rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer h-28 group transition-all ${evidenceFiles[item.id - 1] ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 hover:border-indigo-500/50 bg-black/20 hover:bg-indigo-500/10 shadow-inner'}`}>
                        <input type="file" id={`evidence${item.id}`} name={`evidence${item.id}`} accept="image/*" required={item.req} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" onChange={(e) => handleEvidenceChange(e, item.id - 1)} />
                        <span className={`mb-2 transition-all duration-300 ${evidenceFiles[item.id - 1] ? '' : 'opacity-30 group-hover:opacity-100'}`}>
                          {evidenceFiles[item.id - 1] ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : (item.id === 3 ? <Plus className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" /> : <Camera className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />)}
                        </span>
                        <p className={`text-[9px] font-bold uppercase tracking-wider transition-colors leading-tight ${evidenceFiles[item.id - 1] ? 'text-emerald-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                          {evidenceFiles[item.id - 1] ? 'Terpilih' : item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={loading} className={`w-full py-4 px-6 text-white font-black text-lg rounded-2xl shadow-xl transition-all duration-300 flex justify-center items-center gap-2 ${loading ? 'bg-white/5 text-slate-500 shadow-none cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 active:scale-[0.98] shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-white/10 hover:border-white/20'}`}>
                    {loading ? 'Mengunggah...' : <>Kirim Laporan <Send className="w-5 h-5 ml-1" /></>}
                  </button>
                </div>
              </form>
            </div>
          )}


          {/* ---------------------------------------------------- */}
          {/* KONTEN TAB 2: LAPORAN STATISTIK & FILTER               */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'stats' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">

              {/* HEADER STATS & INPUT FILTER BULAN (DESAIN PREMIUM) */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-white tracking-tight">Data Laporan</h3>

                <div className="relative flex items-center gap-2 bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-300 border border-white/5 hover:border-white/10 px-3 py-2 rounded-xl shadow-sm cursor-pointer group overflow-hidden backdrop-blur-md">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  <div className="text-xs text-white font-bold flex items-center tracking-wide">
                    {selectedMonthName} <span className="text-indigo-400 mx-1.5 font-black">|</span> {selYear}
                  </div>
                  {/* Input Gaib */}
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* KARTU POSISI ANTREAN (Hero Card Khusus Antrean) */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 p-6 rounded-3xl shadow-lg border border-indigo-500/30 relative overflow-hidden flex items-center justify-between">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl"></div>
                <div>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Posisi Antrean Anda</p>
                  <p className="text-sm text-slate-300 font-medium">Menunggu giliran pencairan</p>
                </div>
                <div className="text-4xl font-black text-white">
                  {stats.queuePosition > 0 ? `#${stats.queuePosition}` : '-'}
                </div>
              </div>

              {/* GRID KARTU METRIK RUPIAH */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 shadow-xl backdrop-blur-xl hover:bg-slate-900/60 transition-colors duration-300">
                  <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center"><Clock className="w-3 h-3 mr-1.5" /> Sedang Dicek</p>
                  <p className="text-xl font-black text-white mt-2">{formatRp(stats.pending)}</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 shadow-xl backdrop-blur-xl hover:bg-slate-900/60 transition-colors duration-300">
                  <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center"><Building className="w-3 h-3 mr-1.5" /> Menunggu Cair</p>
                  <p className="text-xl font-black text-white mt-2">{formatRp(stats.approved)}</p>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 shadow-xl backdrop-blur-xl hover:bg-slate-900/60 transition-colors duration-300">
                  <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Sudah Cair</p>
                  <p className="text-xl font-black text-white mt-2">{formatRp(stats.paid)}</p>
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* KONTEN TAB 3: RIWAYAT KLAIM (DENGAN FEEDBACK REJECT)   */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">

              {/* HEADER RIWAYAT & FILTER BULAN */}
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-white tracking-tight">Riwayat Klaim</h3>

                <div className="relative flex items-center gap-2 bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-300 border border-white/5 hover:border-white/10 px-3 py-2 rounded-xl shadow-sm cursor-pointer group overflow-hidden backdrop-blur-md">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                  <div className="text-xs text-white font-bold flex items-center tracking-wide">
                    {selectedMonthName} <span className="text-indigo-400 mx-1.5 font-black">|</span> {selYear}
                  </div>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* LOADING STATE */}
              {claimsLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                </div>
              )}

              {/* EMPTY STATE */}
              {!claimsLoading && claims.length === 0 && (
                <div className="bg-slate-900/20 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
                  <List className="w-12 h-12 mx-auto text-slate-500 opacity-50 mb-4" />
                  <p className="text-slate-400 font-bold text-lg">Belum Ada Klaim</p>
                  <p className="text-slate-500 text-sm mt-2">Tidak ada data klaim untuk periode ini.</p>
                </div>
              )}

              {/* LIST KLAIM */}
              {!claimsLoading && claims.length > 0 && (
                <div className="space-y-3">
                  {claims.map((claim) => {
                    // Status badge config
                    const statusConfig = {
                      PENDING: { color: 'amber', icon: <Clock className="w-3 h-3 mr-1" />, label: 'Menunggu' },
                      APPROVED: { color: 'blue', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: 'Disetujui' },
                      PAID: { color: 'emerald', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: 'Sudah Cair' },
                      REJECTED: { color: 'rose', icon: <XCircle className="w-3 h-3 mr-1" />, label: 'Ditolak' }
                    };
                    const status = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.PENDING;

                    return (
                      <div
                        key={claim.id}
                        onClick={() => setSelectedClaimId(claim.id)}
                        className={`bg-black/20 hover:bg-black/40 rounded-2xl border shadow-xl backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 ${claim.status === 'REJECTED' ? 'border-rose-500/30 hover:border-rose-500/50' : 'border-white/5 hover:border-white/10'}`}
                      >
                        {/* Header Card */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${claim.status === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-black/20 border-white/5'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center ${claim.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              claim.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                claim.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                              {status.icon} {status.label}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(claim.expenseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{claim.categoryName}</p>
                              {claim.description && claim.status !== 'REJECTED' && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{claim.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="text-lg font-black text-emerald-400 whitespace-nowrap">
                                {formatRp(claim.amount)}
                              </p>
                              {claim.status === 'PENDING' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingClaimId(claim.id);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-500/20 transition-colors flex items-center"
                                >
                                  <Edit2 className="w-3 h-3 mr-1" /> Edit Bon
                                </button>
                              )}
                            </div>
                          </div>

                          {/* REJECTION REASON - HIGHLIGHTED */}
                          {claim.status === 'REJECTED' && claim.rejectionReason && (
                            <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Alasan Penolakan
                              </p>
                              <p className="text-sm font-semibold text-rose-300 leading-relaxed">
                                {claim.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}


          <div className="mt-8 pb-8">
            <VandizaBrand />
          </div>

        </div>
      </main>

      {/* MODAL EDIT KLAIM */}
      {editingClaimId && (
        <EditClaimModal
          claimId={editingClaimId}
          categories={categories}
          onClose={() => setEditingClaimId(null)}
          onSuccess={() => {
            setEditingClaimId(null);
            toast.success('Laporan Anda berhasil diperbarui!');
            // Refresh data tab history
            getTechnicianClaims(selectedMonth).then((data) => { if (data) setClaims(data); });
            getTechnicianStats(selectedMonth).then((data) => { if (data) setStats(data); });
          }}
        />
      )}

      {/* MODAL DETAIL KLAIM */}
      {selectedClaimId && (
        <ClaimDetailModal
          claimId={selectedClaimId}
          onClose={() => setSelectedClaimId(null)}
        />
      )}

    </div>
  );
}

// ============================================================================
// KOMPONEN MODAL EDIT BON OLEH TEKNISI
// ============================================================================
function EditClaimModal({ claimId, categories, onClose, onSuccess }: { claimId: string, categories: Category[], onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Data State
  const [formData, setFormData] = useState({
    categoryId: '',
    expenseDate: '',
    amount: '',
    description: '',
    vehiclePlate: '',
    kmBefore: '',
    kmAfter: ''
  });

  // Local File States untuk Update
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<(File | null)[]>([null, null, null]);
  const [compressedReceipt, setCompressedReceipt] = useState<File | null>(null);
  const [compressedEvidence, setCompressedEvidence] = useState<(File | null)[]>([null, null, null]);

  // Load Data
  useEffect(() => {
    getClaimForEdit(claimId).then(res => {
      if (res.success && res.expense) {
        const d = res.expense;
        setFormData({
          categoryId: d.categoryId,
          expenseDate: new Date(d.expenseDate).toISOString().split('T')[0],
          amount: String(d.amount),
          description: d.description || '',
          vehiclePlate: d.vehiclePlate || '',
          kmBefore: d.kmBefore ? String(d.kmBefore) : '',
          kmAfter: d.kmAfter ? String(d.kmAfter) : ''
        });
      } else {
        setErrorMsg(res.message || 'Gagal memuat data');
      }
      setLoading(false);
    });
  }, [claimId]);

  // Image Compressor Sama dengan Utama
  const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            else reject(new Error('Compression failed'));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    if (file) {
      try { setCompressedReceipt(await compressImage(file)); }
      catch { setCompressedReceipt(file); }
    } else setCompressedReceipt(null);
  };

  const handleEvidenceChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] || null;
    const newFiles = [...evidenceFiles]; newFiles[index] = file; setEvidenceFiles(newFiles);
    if (file) {
      try {
        const compressed = await compressImage(file);
        const newCompressed = [...compressedEvidence]; newCompressed[index] = compressed; setCompressedEvidence(newCompressed);
      } catch {
        const newCompressed = [...compressedEvidence]; newCompressed[index] = file; setCompressedEvidence(newCompressed);
      }
    } else {
      const newCompressed = [...compressedEvidence]; newCompressed[index] = null; setCompressedEvidence(newCompressed);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Fungsi bantuan untuk upload
      const uploadToBlob = async (file: File, prefix: string) => {
        const safeName = `${prefix}-edit-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const newBlob = await upload(safeName, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        return newBlob.url;
      };

      const payload = new FormData();
      payload.append('amount', formData.amount);
      payload.append('description', formData.description);
      payload.append('categoryId', formData.categoryId);
      payload.append('expenseDate', formData.expenseDate);
      if (formData.kmBefore) payload.append('kmBefore', formData.kmBefore);
      if (formData.kmAfter) payload.append('kmAfter', formData.kmAfter);
      if (formData.vehiclePlate) payload.append('vehiclePlate', formData.vehiclePlate);

      // 2. Cek apakah ada file baru yang diunggah? Jika ada, upload dulu ke Blob
      if (compressedReceipt || compressedEvidence.some(file => file !== null)) {
         setErrorMsg('Mengunggah pembaruan foto... ⏳');
      }

      if (compressedReceipt) {
        const url = await uploadToBlob(compressedReceipt, 'receipt');
        payload.append('receiptUrl', url);
      }
      if (compressedEvidence[0]) {
        const url = await uploadToBlob(compressedEvidence[0], 'ev1');
        payload.append('evidence1Url', url);
      }
      if (compressedEvidence[1]) {
        const url = await uploadToBlob(compressedEvidence[1], 'ev2');
        payload.append('evidence2Url', url);
      }
      if (compressedEvidence[2]) {
        const url = await uploadToBlob(compressedEvidence[2], 'ev3');
        payload.append('evidence3Url', url);
      }

      setErrorMsg('');

      // 3. Kirim teks URL ke Server Action
      const result = await updateReimbursement(claimId, payload);
      
      if (result.success) {
        onSuccess();
      } else {
        setErrorMsg(result.message);
      }
      
    } catch (error: any) {
      console.error('Update Claim Error:', error);
      setErrorMsg(error.message || '⚠️ Gagal menyimpan pembaruan. Pastikan koneksi stabil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 shrink-0">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Bon Laporan
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Perbarui data laporan sebelum disetujui Admin</p>
          </div>
          <button type="button" disabled={submitting} onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>
          ) : errorMsg && !submitting ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-4">
              <p className="text-rose-400 text-sm font-semibold">{errorMsg}</p>
            </div>
          ) : (
            <form id="editForm" onSubmit={handleSubmitEdit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 ml-1">Kategori</label>
                  <select
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none disabled:opacity-50"
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Pilih...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 ml-1">Tgl Nota</label>
                  <input
                    type="date" required disabled={submitting}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm outline-none disabled:opacity-50"
                    value={formData.expenseDate}
                    onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 ml-1">Nominal (Rp)</label>
                <input
                  type="text" inputMode="numeric" pattern="[0-9]*" required disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 text-indigo-400 font-bold text-lg outline-none disabled:opacity-50"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value.replace(/[^0-9]/g, '') })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 ml-1">Deskripsi/Tiket</label>
                <textarea
                  required rows={2} disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 text-white text-sm outline-none resize-none disabled:opacity-50"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 ml-1">Plat Nomor Kendaraan</label>
                <input
                  type="text" required disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-indigo-500 text-white text-sm outline-none disabled:opacity-50"
                  placeholder="Contoh: B 1234 ABC"
                  value={formData.vehiclePlate}
                  onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 ml-1">KM Sblm (Opsional)</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={submitting} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none disabled:opacity-50" value={formData.kmBefore} onChange={e => setFormData({ ...formData, kmBefore: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400 ml-1">KM Ssdh (Opsional)</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={submitting} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm outline-none disabled:opacity-50" value={formData.kmAfter} onChange={e => setFormData({ ...formData, kmAfter: e.target.value.replace(/[^0-9]/g, '') })} />
                </div>
              </div>

              <div className="w-full h-px bg-slate-800 my-4"></div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl mb-4">
                <p className="text-xs text-indigo-300 font-medium leading-relaxed">
                  Informasi: Foto/Bukti sebelumnya sudah tersimpan di sistem.
                  <strong className="font-black text-indigo-200"> Jangan unggah foto apa pun di bawah ini kecuali Anda bermaksud menimpa (mengganti) foto yang salah dengan yang baru.</strong>
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white ml-1">Ganti Foto Struk</label>
                <div className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${receiptFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-600 bg-slate-950'}`}>
                  <input type="file" disabled={submitting} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:opacity-0 disabled:cursor-not-allowed" onChange={handleReceiptChange} />
                  <span className="mb-2">{receiptFile ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Receipt className="w-6 h-6 text-slate-400" />}</span>
                  <p className={`text-[10px] font-bold ${receiptFile ? 'text-emerald-400' : 'text-slate-400'}`}>{receiptFile ? receiptFile.name : 'Ketuk untuk Timpa Foto'}</p>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-white ml-1 mb-2">Ganti Bukti Lapangan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 1, label: 'KM Sblm' },
                    { id: 2, label: 'KM Ssdh' },
                    { id: 3, label: 'Evid Tambahan' }
                  ].map((item) => (
                    <div key={item.id} className={`relative border border-dashed rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer h-20 transition-all ${evidenceFiles[item.id - 1] ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-600 bg-slate-950'}`}>
                      <input type="file" disabled={submitting} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" onChange={(e) => handleEvidenceChange(e, item.id - 1)} />
                      <span className={`mb-1 transition-all ${evidenceFiles[item.id - 1] ? '' : 'opacity-50'}`}>
                        {evidenceFiles[item.id - 1] ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Camera className="w-5 h-5 text-slate-400" />}
                      </span>
                      <p className={`text-[8px] font-bold uppercase tracking-wider leading-tight ${evidenceFiles[item.id - 1] ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/20 shrink-0 flex justify-end gap-3">
          <button type="button" disabled={submitting} onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50">
            Batal
          </button>
          <button type="submit" form="editForm" disabled={loading || submitting} className="px-6 py-2.5 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none">
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
            ) : "Simpan Perbaikan"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// KOMPONEN MODAL DETAIL KLAIM UNTUK TEKNISI (RIWAYAT)
// ============================================================================
function ClaimDetailModal({ claimId, onClose }: { claimId: string, onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    getClaimDetail(claimId).then(res => {
      if (res.success && res.expense) {
        setClaim(res.expense);
      } else {
        setErrorMsg(res.message || 'Gagal memuat detail laporan');
      }
      setLoading(false);
    });
  }, [claimId]);

  const formatRp = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Parsing alasan penolakan jika ada
  let rejectionReason = null;
  if (claim && claim.status === 'REJECTED' && claim.description) {
    if (claim.description.includes('REJECTED:')) {
      const match = claim.description.match(/REJECTED:\s*(.+?)(?:\n|$)/);
      if (match) {
        rejectionReason = match[1].trim();
      }
    }
  }

  // Bersihkan deskripsi dari string REJECTED: ...
  const cleanDescription = (desc: string | null) => {
    if (!desc) return '';
    return desc.replace(/REJECTED:\s*.+?(\n|$)/, '').trim();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: { color: 'amber', icon: '⏳', label: 'Menunggu Dicek', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', desc: 'Laporan Anda sedang dalam antrean verifikasi oleh Admin.' },
      APPROVED: { color: 'blue', icon: '✓', label: 'Disetujui', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', desc: 'Laporan disetujui! Menunggu proses pencairan dana oleh Admin.' },
      PAID: { color: 'emerald', icon: '✅', label: 'Sudah Cair', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', desc: 'Dana klaim Anda telah berhasil dicairkan ke kas Anda.' },
      REJECTED: { color: 'rose', icon: '✕', label: 'Ditolak', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', desc: 'Laporan Anda ditolak oleh Admin. Silakan periksa alasan penolakan.' }
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const getAttachmentLabel = (type: string) => {
    const labels = {
      RECEIPT: 'BON / STRUK',
      EVIDENCE_1: 'KM SEBELUM',
      EVIDENCE_2: 'KM SESUDAH',
      EVIDENCE_3: 'EVIDEN TAMBAHAN'
    };
    return labels[type as keyof typeof labels] || 'FOTO BUKTI';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 shrink-0">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <List className="w-5 h-5 text-indigo-400" /> Detail Laporan Klaim
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Detail informasi pengajuan operasional Anda</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all"><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div></div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <p className="text-rose-400 text-sm font-semibold">{errorMsg}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Section */}
              <div className={`p-4 rounded-2xl border ${getStatusConfig(claim.status).bg}`}>
                <div className="flex items-center gap-2 font-black text-base uppercase tracking-wider">
                  <span>{getStatusConfig(claim.status).icon}</span>
                  <span>{getStatusConfig(claim.status).label}</span>
                </div>
                <p className="text-xs font-medium mt-1.5 opacity-90 leading-relaxed">
                  {getStatusConfig(claim.status).desc}
                </p>
                {claim.status === 'REJECTED' && rejectionReason && (
                  <div className="mt-3 bg-slate-950/40 rounded-xl p-3 border border-rose-500/20">
                    <p className="text-[10px] font-black text-rose-300 uppercase tracking-wider mb-0.5">Alasan Penolakan:</p>
                    <p className="text-sm font-bold text-white leading-relaxed">{rejectionReason}</p>
                  </div>
                )}
                {claim.status === 'PAID' && (
                  <div className="mt-3 bg-slate-950/40 rounded-xl p-3 border border-emerald-500/20 text-xs text-white space-y-1">
                    {claim.paidAt && (
                      <p><span className="text-slate-400">Tanggal Cair:</span> <span className="font-bold">{new Date(claim.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span></p>
                    )}
                    {claim.paymentReference && (
                      <p className="font-mono text-[11px]"><span className="text-slate-400 not-mono font-sans text-xs">Referensi / Keterangan:</span> <span className="font-bold">{claim.paymentReference}</span></p>
                    )}
                  </div>
                )}
              </div>

              {/* Detail Info Grid */}
              <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 space-y-4">
                {/* Nominal */}
                <div className="border-b border-slate-800/80 pb-3 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nominal Pengeluaran</p>
                    <p className="text-2xl font-black text-emerald-400 mt-0.5">{formatRp(claim.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kategori</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider">
                      {claim.category?.name || 'Operasional'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tanggal Nota</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {new Date(claim.expenseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Plat Kendaraan</p>
                    <p className="text-sm font-bold text-white mt-1 uppercase">
                      {claim.vehiclePlate || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KM Sebelum</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {claim.kmBefore !== null ? `${claim.kmBefore.toLocaleString('id-ID')} km` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">KM Sesudah</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {claim.kmAfter !== null ? `${claim.kmAfter.toLocaleString('id-ID')} km` : '-'}
                    </p>
                  </div>
                </div>

                {claim.kmBefore !== null && claim.kmAfter !== null && (
                  <div className="pt-2 border-t border-slate-800/50">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Jarak Tempuh</p>
                    <p className="text-sm font-extrabold text-indigo-400 mt-0.5">
                      {Math.max(0, claim.kmAfter - claim.kmBefore).toLocaleString('id-ID')} km
                    </p>
                  </div>
                )}

                {/* Deskripsi */}
                <div className="pt-3 border-t border-slate-800/80">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Deskripsi Pekerjaan / Tiket</p>
                  <p className="text-sm font-semibold text-slate-300 mt-1.5 whitespace-pre-line leading-relaxed">
                    {cleanDescription(claim.description) || <span className="text-slate-600 italic">Tidak ada deskripsi</span>}
                  </p>
                </div>
              </div>

              {/* Foto Bukti */}
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3 ml-1">Foto Bukti & Lampiran</h4>
                {claim.attachments && claim.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {claim.attachments.map((att: any) => {
                      const label = getAttachmentLabel(att.type);
                      return (
                        <div
                          key={att.id}
                          onClick={() => setLightboxImg({ url: att.fileUrl, title: label })}
                          className="group relative bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer transition-all duration-300"
                        >
                          <img
                            src={att.fileUrl}
                            alt={label}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg w-max mb-1">
                              {att.type === 'RECEIPT' ? 'BON / STRUK' : att.type === 'EVIDENCE_1' ? 'KM SEBELUM' : att.type === 'EVIDENCE_2' ? 'KM SESUDAH' : 'EVIDEN'}
                            </span>
                            <span className="text-[8px] font-medium text-slate-400 group-hover:text-indigo-300 transition-colors">Ketuk untuk memperbesar</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-800/20 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs font-semibold">
                    Tidak ada lampiran foto untuk laporan ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/20 shrink-0 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
            Tutup Detail
          </button>
        </div>
      </div>

      {/* Lightbox fullscreen */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in zoom-in-95 duration-250"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center gap-3">
            <h4 className="text-white font-black text-sm uppercase tracking-widest bg-slate-900/90 border border-slate-850 px-4 py-2 rounded-xl shrink-0 select-none">
              {lightboxImg.title}
            </h4>
            <div className="relative flex-1 max-h-[80vh] w-full flex items-center justify-center">
              <img
                src={lightboxImg.url}
                alt={lightboxImg.title}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-slate-800"
              />
            </div>
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-slate-400 hover:text-white rounded-full p-2.5 hover:bg-rose-500/20 border border-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <p className="text-xs text-slate-500 font-semibold select-none">Ketuk di mana saja untuk kembali</p>
          </div>
        </div>
      )}
    </div>
  );
}