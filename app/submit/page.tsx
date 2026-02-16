'use client'

import { useRef, useState } from 'react';
import { submitReimbursement } from '@/app/actions/reimbursement';
import LogoutButton from '@/app/components/LogoutButton';

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
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center">
      
      {/* Container Form Utama */}
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 relative">
        
        {/* HEADER & LOGOUT BUTTON (Dibuat sejajar) */}
        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Form Operasional</h1>
            <p className="text-gray-500 text-sm">Input bon dan bukti kerja.</p>
          </div>
          <LogoutButton />
        </div>

        {/* Notifikasi Sukses/Gagal */}
        {message && (
          <div className={`p-4 mb-6 rounded-md ${message.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
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

          {/* FOTO 1: BON/STRUK (WAJIB) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label htmlFor="receipt" className="block text-sm font-bold text-blue-900 mb-1">1. Foto Bon/Struk (Wajib) 🧾</label>
            <p className="text-xs text-blue-700 mb-2">Foto bukti pembayaran atau struk bensin.</p>
            <input 
              type="file" 
              id="receipt" 
              name="receipt" 
              accept="image/*" 
              required 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          {/* FOTO PENDUKUNG (OPSIONAL) */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <p className="text-sm font-bold text-gray-700 mb-3">Foto Pendukung Pekerjaan (Opsional):</p>
            
            <div className="space-y-4">
              {/* FOTO 2: EVIDEN 1 */}
              <div>
                <label htmlFor="evidence1" className="block text-sm font-medium text-gray-600 mb-1">2. Eviden 1 📸</label>
                <input 
                  type="file" id="evidence1" name="evidence1" accept="image/*" 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              {/* FOTO 3: EVIDEN 2 */}
              <div>
                <label htmlFor="evidence2" className="block text-sm font-medium text-gray-600 mb-1">3. Eviden 2 📸</label>
                <input 
                  type="file" id="evidence2" name="evidence2" accept="image/*" 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              {/* FOTO 4: EVIDEN 3 */}
              <div>
                <label htmlFor="evidence3" className="block text-sm font-medium text-gray-600 mb-1">4. Eviden 3 📸</label>
                <input 
                  type="file" id="evidence3" name="evidence3" accept="image/*" 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-semibold rounded-lg shadow-md transition-all mt-6 ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? 'Mengunggah & Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
      
      {/* Footer / Copyright kecil di bawah */}
      <p className="mt-8 text-xs text-gray-400">© 2026 Sistem Operasional Internal</p>
    </div>
  );
}