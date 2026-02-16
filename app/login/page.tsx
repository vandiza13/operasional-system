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
      if (result.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/submit');
      }
    } else {
      setMessage(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-10 relative overflow-hidden">
        
        {/* Dekorasi Latar Belakang Geometris */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-violet-600/10"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 text-center mb-10 mt-4">
          <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center justify-center mb-6 border border-slate-50 transform transition-transform hover:scale-105">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Masuk Sistem</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Aplikasi Operasional Internal</p>
        </div>

        {/* Notifikasi Error */}
        {message && (
          <div className="p-4 mb-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-xl">⚠️</span> {message}
          </div>
        )}

        <form action={handleLogin} className="space-y-5 relative z-10">
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">Email Karyawan</label>
            <input 
              type="email" name="email" required placeholder="email@perusahaan.com"
              className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800 font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
            <input 
              type="password" name="password" required placeholder="••••••••"
              className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-800 font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 px-6 text-white font-bold text-lg rounded-2xl shadow-lg transition-all flex justify-center items-center gap-2 ${
                loading 
                ? 'bg-slate-400 shadow-none cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] shadow-indigo-200'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      <p className="text-xs text-slate-400 font-medium mt-8 text-center">
        Akses Terbatas • Sistem Terenkripsi<br/>© 2026 Hak Cipta Dilindungi
      </p>

    </div>
  );
}