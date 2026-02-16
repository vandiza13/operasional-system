'use client'

import { useRef, useState } from 'react';
import { submitReimbursement } from '@/app/actions/reimbursement';

export default function SubmitPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fungsi untuk menangani saat teknisi menekan tombol "Kirim Laporan"
  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage('');
    
    // Panggil Server Action yang kita buat tadi
    const result = await submitReimbursement(formData);
    
    setMessage(result.message);
    setLoading(false);

    // Kosongkan form jika berhasil
    if (result.success) {
      formRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Form Operasional</h1>
        <p className="text-gray-500 mb-6 text-sm">Input pengeluaran kamu di sini. Uang akan dicairkan berdasarkan urutan antrean.</p>

        {/* Notifikasi Sukses/Gagal */}
        {message && (
          <div className={`p-4 mb-6 rounded-md ${message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Form Input */}
        <form ref={formRef} action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <input 
              type="number" 
              id="amount" 
              name="amount" 
              required 
              placeholder="Contoh: 50000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Keterangan Pengeluaran</label>
            <textarea 
              id="description" 
              name="description" 
              required 
              rows={3}
              placeholder="Contoh: Isi bensin motor B 1234 CD untuk ke lokasi proyek A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            ></textarea>
          </div>

        {/* Tombol ASLI untuk upload foto */}
          <div>
            <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-1">Foto Bukti (Struk/Bon)</label>
            <input 
              type="file" 
              id="evidence" 
              name="evidence" 
              accept="image/*" 
              capture="environment" // Trik sakti: Langsung buka kamera belakang di HP!
              required 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white 
                file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 
                file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition-all ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Mengirim Data...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
}