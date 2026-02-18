'use client'

import { useRef, useState, useEffect } from 'react';
import { submitReimbursement } from '@/app/actions/reimbursement';
import { getTechnicianStats, getTechnicianClaims, ClaimHistory } from '@/app/actions/stats';
import { getCurrentUser } from '@/app/actions/user';
import { getAllCategories } from '@/app/actions/categories';
import LogoutButton from '@/app/components/LogoutButton';


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
    setMessage('');

    const formData = new FormData();
    const form = e.currentTarget;
    formData.append('amount', (form.elements.namedItem('amount') as HTMLInputElement).value);
    formData.append('description', (form.elements.namedItem('description') as HTMLTextAreaElement).value);
    formData.append('categoryId', (form.elements.namedItem('categoryId') as HTMLSelectElement).value);
    formData.append('expenseDate', (form.elements.namedItem('expenseDate') as HTMLInputElement).value);
    
    if (compressedReceipt) formData.append('receipt', compressedReceipt);
    if (compressedEvidence[0]) formData.append('evidence1', compressedEvidence[0]);
    if (compressedEvidence[1]) formData.append('evidence2', compressedEvidence[1]);
    if (compressedEvidence[2]) formData.append('evidence3', compressedEvidence[2]);
    
    const result = await submitReimbursement(formData);
    
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      formRef.current?.reset();
      setReceiptFile(null);
      setEvidenceFiles([null, null, null]);
      setCompressedReceipt(null);
      setCompressedEvidence([null, null, null]);
      
      // Berpindah otomatis ke tab statistik setelah sukses submit
      setActiveTab('stats');
      getTechnicianStats(selectedMonth).then((data) => { if (data) setStats(data); });
    }
  };

  const formatRp = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Kompresi Gambar Client-Side
  const compressImage = async (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
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
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 pb-12">
      
      {/* HEADER */}
      <header className="bg-slate-950 sticky top-0 z-20 border-b border-slate-800/60 shadow-lg px-5 py-4 flex justify-between items-center">
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
        <LogoutButton />
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 md:py-8 flex justify-center w-full">
        <div className="w-full max-w-lg space-y-6">
          
          {/* KARTU PROFIL TEKNISI */}
          <div className="bg-slate-800/50 rounded-[2rem] p-6 shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-inner flex-shrink-0">
                <span className="text-3xl">👷‍♂️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-extrabold text-white truncate">{profile.name}</h2>
                <p className="text-sm font-bold text-indigo-400 truncate">{profile.position || 'Teknisi Lapangan'}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1"><span className="text-slate-500">🆔</span> {profile.nik || '-'}</span>
                  <span className="flex items-center gap-1"><span className="text-slate-500">📱</span> {profile.phone || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGASI (SEGMENTED CONTROL) */}
          <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              📝 Klaim
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              📊 Statistik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            >
              📋 Riwayat
            </button>
          </div>


          {/* NOTIFIKASI */}
          {message && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 transition-all shadow-sm ${message.includes('berhasil') ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
              <span className="text-xl">{message.includes('berhasil') ? '🎉' : '⚠️'}</span>
              <p className={`text-sm font-semibold pt-0.5 ${message.includes('berhasil') ? 'text-emerald-400' : 'text-rose-400'}`}>{message}</p>
            </div>
          )}


          {/* ---------------------------------------------------- */}
          {/* KONTEN TAB 1: FORM KLAIM BARU                          */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'form' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-2 mb-5">
                <h3 className="text-2xl font-black text-white tracking-tight">Formulir Klaim</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Isi detail dan unggah 4 foto wajib.</p>
              </div>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-slate-800/50 p-6 sm:p-8 rounded-[2rem] shadow-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="categoryId" className="block text-sm font-bold text-slate-400 ml-1">Kategori</label>
                    <select id="categoryId" name="categoryId" required className="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all cursor-pointer">
                      <option value="">Pilih...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="expenseDate" className="block text-sm font-bold text-slate-400 ml-1">Tgl Nota</label>
                    <input type="date" id="expenseDate" name="expenseDate" required className="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all dark-date-picker" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="amount" className="block text-sm font-bold text-slate-400 ml-1">Nominal Pengeluaran (Rp)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><span className="text-slate-500 font-extrabold">Rp</span></div>
                    <input type="number" id="amount" name="amount" required min="1" placeholder="0" className="w-full pl-12 pr-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-indigo-400 font-black text-xl outline-none transition-all placeholder:text-slate-600 placeholder:font-normal" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-bold text-slate-400 ml-1">Keterangan Pekerjaan</label>
                  <textarea id="description" name="description" required rows={2} placeholder="Contoh: Beli bensin untuk proyek A..." className="w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl focus:bg-slate-950 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white text-sm font-medium outline-none transition-all resize-none placeholder:text-slate-600 placeholder:font-normal"></textarea>
                </div>

                <div className="w-full h-px bg-slate-700/50 my-4"></div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-white ml-1">1. Foto Bon/Struk <span className="text-rose-500">*</span></label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all ${receiptFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10'}`}>
                    <input type="file" id="receipt" name="receipt" accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleReceiptChange} />
                    <div className={`w-14 h-14 rounded-full shadow-inner border mb-3 flex items-center justify-center transition-all duration-300 ${receiptFile ? 'bg-emerald-900/50 border-emerald-500/50 scale-110' : 'bg-slate-900 border-slate-700/50 group-hover:scale-110 group-hover:border-indigo-500/50'}`}>
                      <span className="text-2xl">{receiptFile ? '✅' : '🧾'}</span>
                    </div>
                    <p className={`text-sm font-bold ${receiptFile ? 'text-emerald-400' : 'text-indigo-400'}`}>{receiptFile ? receiptFile.name : 'Ketuk untuk pilih Struk'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-bold text-white ml-1 mb-2">2. Foto Bukti Lapangan <span className="text-rose-500 text-xs font-normal ml-1">(Wajib 3 Foto)</span></label>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className={`relative border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer h-28 group transition-all ${evidenceFiles[num-1] ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-600 hover:border-indigo-500/50 bg-slate-900 hover:bg-indigo-500/5'}`}>
                        <input type="file" id={`evidence${num}`} name={`evidence${num}`} accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleEvidenceChange(e, num-1)} />
                        <span className={`text-2xl mb-2 transition-all duration-300 ${evidenceFiles[num-1] ? '' : 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                          {evidenceFiles[num-1] ? '✅' : '📸'}
                        </span>
                        <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${evidenceFiles[num-1] ? 'text-emerald-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                          {evidenceFiles[num-1] ? 'Terpilih' : `Bukti ${num}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={loading} className={`w-full py-4 px-6 text-white font-black text-lg rounded-2xl shadow-xl transition-all flex justify-center items-center gap-2 ${loading ? 'bg-slate-700 text-slate-400 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 shadow-indigo-900/50'}`}>
                    {loading ? 'Mengunggah...' : 'Kirim Laporan 🚀'}
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
                
                <div className="relative flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 px-3 py-2 rounded-xl shadow-sm cursor-pointer group overflow-hidden">
                  <span className="text-sm group-hover:scale-110 transition-transform">📅</span>
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
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1.5"><span className="text-sm">⏳</span> Sedang Dicek</p>
                  <p className="text-xl font-black text-white mt-2">{formatRp(stats.pending)}</p>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><span className="text-sm">🏦</span> Menunggu Cair</p>
                  <p className="text-xl font-black text-white mt-2">{formatRp(stats.approved)}</p>
                </div>
                <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50 shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><span className="text-sm">✅</span> Sudah Cair</p>
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
                
                <div className="relative flex items-center gap-2 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 px-3 py-2 rounded-xl shadow-sm cursor-pointer group overflow-hidden">
                  <span className="text-sm group-hover:scale-110 transition-transform">📅</span>
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
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-3xl p-12 text-center backdrop-blur-sm">
                  <div className="text-5xl mb-4 grayscale opacity-30">📋</div>
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
                      PENDING: { color: 'amber', icon: '⏳', label: 'Menunggu' },
                      APPROVED: { color: 'blue', icon: '✓', label: 'Disetujui' },
                      PAID: { color: 'emerald', icon: '✅', label: 'Sudah Cair' },
                      REJECTED: { color: 'rose', icon: '✕', label: 'Ditolak' }
                    };
                    const status = statusConfig[claim.status as keyof typeof statusConfig] || statusConfig.PENDING;

                    return (
                      <div 
                        key={claim.id} 
                        className={`bg-slate-800/50 rounded-2xl border shadow-sm backdrop-blur-sm overflow-hidden ${
                          claim.status === 'REJECTED' ? 'border-rose-500/30' : 'border-slate-700/50'
                        }`}
                      >
                        {/* Header Card */}
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${
                          claim.status === 'REJECTED' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-slate-900/30 border-slate-700/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              claim.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
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
                            <p className="text-lg font-black text-emerald-400 whitespace-nowrap">
                              {formatRp(claim.amount)}
                            </p>
                          </div>

                          {/* REJECTION REASON - HIGHLIGHTED */}
                          {claim.status === 'REJECTED' && claim.rejectionReason && (
                            <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span>🚫</span> Alasan Penolakan
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


          <div className="text-center mt-8 pb-8">
            <p className="text-xs text-slate-500 font-medium">Sistem Operasional Internal © 2026</p>
          </div>
          
        </div>
      </main>
    </div>
  );
}
