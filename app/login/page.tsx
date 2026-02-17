'use client'

import { useState } from 'react';
import { loginUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    setMessage('');
    
    const result = await loginUser(formData);
    
    if (result.success) {
      // Pintu Masuk Disesuaikan: Admin & Super Admin masuk ke portal yang sama
      if (result.role === 'SUPER_ADMIN' || result.role === 'ADMIN') {
        router.push('/admin'); 
      } else {
        router.push('/submit'); // Teknisi masuk ke form
      }
    } else {
      setMessage(result.message);
      setLoading(false);
    }
  };

  return (
    // DARK THEME BACKGROUND
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 rounded-[2.5rem] shadow-2xl border border-slate-800 p-6 sm:p-10 relative overflow-hidden backdrop-blur-xl z-10">
        
        {/* Dekorasi Latar Belakang Geometris Dalam Kotak */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

        <div className="relative z-10 text-center mb-10 mt-4">
          <div className="w-20 h-20 mx-auto bg-slate-950 rounded-2xl shadow-inner shadow-black/50 flex items-center justify-center mb-6 border border-slate-800 transform transition-transform hover:scale-105 hover:border-indigo-500/50 hover:shadow-indigo-500/20 duration-300">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Masuk Sistem</h1>
          <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide">Aplikasi Operasional Internal</p>
        </div>

        {/* Notifikasi Error (Dark Mode) */}
        {message && (
          <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-xl">⚠️</span> {message}
          </div>
        )}

        <form action={handleLogin} className="space-y-5 relative z-10">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Email Karyawan</label>
            <input 
              type="email" name="email" required placeholder="email@perusahaan.com"
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Password</label>
            <input 
              type="password" name="password" required placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all placeholder:text-slate-600 shadow-inner"
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 px-6 text-white font-bold text-lg rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 ${
                loading 
                ? 'bg-slate-800 text-slate-500 shadow-none cursor-not-allowed border border-slate-700' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] shadow-indigo-900/50 border border-indigo-500/50'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memverifikasi...
                </>
              ) : (
                'Masuk Sekarang ➔'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-10 relative z-10 flex flex-col items-center gap-2">
        <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">
          Akses Terbatas • Enkripsi 256-bit<br/>© 2026 Hak Cipta Dilindungi
        </p>
      </div>

    </div>
  );
}