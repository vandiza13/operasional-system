'use client'

import { useRef, useState } from 'react';
import { submitReimbursement } from '@/app/actions/reimbursement';
import LogoutButton from '@/app/components/LogoutButton';

export default function SubmitPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage('');
    
    const result = await submitReimbursement(formData);
    
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      formRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* HEADER MOBILE-FRIENDLY */}
      <header className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-indigo-200 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Form Klaim</h1>
            <p className="text-xs text-slate-500 font-medium">Sistem Operasional</p>
          </div>
        </div>
        <LogoutButton />
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 px-4 py-6 md:px-0 flex justify-center">
        <div className="w-full max-w-md">
          
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Klaim Baru</h2>
            <p className="text-sm text-slate-500 mt-1">Masukkan detail pengeluaran dan foto bukti.</p>
          </div>

          {/* Notifikasi Sukses/Gagal */}
          {message && (
            <div className={`p-4 mb-6 rounded-2xl flex items-start gap-3 transition-all ${message.includes('berhasil') ? 'bg-emerald-50 border border-emerald-200/50' : 'bg-rose-50 border border-rose-200/50'}`}>
              <span className="text-xl">{message.includes('berhasil') ? '🎉' : '⚠️'}</span>
              <p className={`text-sm font-semibold pt-0.5 ${message.includes('berhasil') ? 'text-emerald-700' : 'text-rose-700'}`}>
                {message}
              </p>
            </div>
          )}

          {/* FORM */}
          <form ref={formRef} action={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            {/* Nominal */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className="block text-sm font-bold text-slate-700 ml-1">Nominal (Rp)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">Rp</span>
                </div>
                <input 
                  type="number" id="amount" name="amount" required placeholder="0"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800 font-bold text-lg outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-sm font-bold text-slate-700 ml-1">Keterangan</label>
              <textarea 
                id="description" name="description" required rows={3} placeholder="Contoh: Bensin motor proyek A..."
                className="w-full px-4 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800 text-sm outline-none transition-all resize-none placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="w-full h-px bg-slate-100 my-2"></div>

            {/* FOTO 1: BON/STRUK (WAJIB) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-indigo-900 ml-1">1. Foto Bon/Struk <span className="text-rose-500">*</span></label>
              <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors rounded-2xl p-4 flex flex-col items-center justify-center text-center group cursor-pointer">
                <input type="file" id="receipt" name="receipt" accept="image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🧾</span>
                </div>
                <p className="text-sm font-bold text-indigo-700">Pilih Foto Bon</p>
                <p className="text-xs text-indigo-500/70 font-medium mt-1">Wajib diisi untuk validasi</p>
              </div>
            </div>

            {/* FOTO PENDUKUNG (OPSIONAL) */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-slate-700 ml-1 mb-2">Foto Pendukung Pekerjaan (Opsional)</label>
              <div className="grid grid-cols-3 gap-3">
                {/* EVIDEN 1 */}
                <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer h-24">
                  <input type="file" id="evidence1" name="evidence1" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <span className="text-2xl mb-1 grayscale opacity-60">📸</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Bukti 1</p>
                </div>
                {/* EVIDEN 2 */}
                <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer h-24">
                  <input type="file" id="evidence2" name="evidence2" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <span className="text-2xl mb-1 grayscale opacity-60">📸</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Bukti 2</p>
                </div>
                {/* EVIDEN 3 */}
                <div className="relative border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer h-24">
                  <input type="file" id="evidence3" name="evidence3" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <span className="text-2xl mb-1 grayscale opacity-60">📸</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Bukti 3</p>
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 px-6 text-white font-bold text-lg rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 ${
                  loading 
                  ? 'bg-slate-400 shadow-none cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] shadow-indigo-200'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  'Kirim Laporan 🚀'
                )}
              </button>
            </div>
            
          </form>
          
          <div className="text-center mt-8 pb-8">
            <p className="text-xs text-slate-400 font-medium">Sistem Operasional Internal © 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}