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

    if (result.success) {
      formRef.current?.reset();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center">
        <span className="bg-purple-100 p-2 rounded-lg mr-3">👨‍🔧</span> Tambah Teknisi Baru
      </h2>
      <p className="text-sm text-gray-500 mb-6">Buat akun resmi untuk tim lapangan agar mereka bisa login.</p>

      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm font-medium ${isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" name="name" required placeholder="Contoh: Budi Santoso" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
            <input type="email" name="email" required placeholder="budi@kantor.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password Sementara</label>
            <input type="password" name="password" required placeholder="minimal 6 karakter" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className={`px-6 py-2 text-white text-sm font-bold rounded-lg transition-all ${loading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}`}>
            {loading ? 'Memproses...' : '+ Daftarkan Teknisi'}
          </button>
        </div>
      </form>
    </div>
  );
}