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
      // Arahkan ke halaman yang sesuai berdasarkan jabatannya
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">🔒</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">Login Sistem</h1>
          <p className="text-gray-500 text-sm mt-1">Masukkan email dan password untuk melanjutkan.</p>
        </div>

        {message && (
          <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
            {message}
          </div>
        )}

        <form action={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input 
              type="email" name="email" required placeholder="email@perusahaan.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" name="password" required placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full py-3 px-4 text-white font-bold rounded-lg shadow-md transition-all mt-4 ${
              loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? 'Memeriksa Data...' : 'Masuk Sekarang'}
          </button>
        </form>
        
      </div>
    </div>
  );
}