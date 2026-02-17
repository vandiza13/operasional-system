'use client'

import { useRef, useState } from 'react';
import { createTechnician } from '@/app/actions/admin';

export default function AddTechnicianForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage('');
    const result = await createTechnician(formData);
    setMessage(result.message);
    setIsSuccess(result.success);
    setLoading(false);
    if (result.success) formRef.current?.reset();
  };

  return (
    <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
      
      <h2 className="text-xl font-extrabold text-white mb-1 flex items-center">
        <span className="bg-purple-500/20 text-purple-400 p-2 rounded-xl mr-3 shadow-sm border border-purple-500/20">👨‍🔧</span> Tambah Teknisi Baru
      </h2>
      <p className="text-sm text-slate-400 mb-6 font-medium">Lengkapi identitas resmi tim lapangan.</p>

      {message && (
        <div className={`p-4 mb-6 rounded-2xl text-sm font-bold flex items-center gap-2 ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          <span>{isSuccess ? '✅' : '⚠️'}</span> {message}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">NIK Karyawan <span className="text-rose-500">*</span></label>
            <input type="text" name="nik" required placeholder="Contoh: 12345678" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Nama Lengkap <span className="text-rose-500">*</span></label>
            <input type="text" name="name" required placeholder="Contoh: Budi Santoso" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Posisi / Jabatan <span className="text-rose-500">*</span></label>
            <input type="text" name="position" required placeholder="Contoh: Teknisi Fiber Optik" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Nomor WhatsApp <span className="text-rose-500">*</span></label>
            <input type="tel" name="phone" required placeholder="Contoh: 081234567890" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
        </div>
        
        <div className="w-full h-px bg-slate-700/50 my-2"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Email Login <span className="text-rose-500">*</span></label>
            <input type="email" name="email" required placeholder="budi@perusahaan.com" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Password Awal <span className="text-rose-500">*</span></label>
            <input type="password" name="password" required placeholder="Minimal 6 karakter" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={loading} className={`w-full md:w-auto px-8 py-3.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 shadow-purple-900/50'}`}>
            {loading ? 'Menyimpan...' : '➕ Daftarkan Teknisi'}
          </button>
        </div>
      </form>
    </div>
  );
}