'use client'

import { useState } from 'react';
import { payoutTechnician } from '@/app/actions/admin';
import toast from 'react-hot-toast'; // [1] Import library notifikasi

export default function PayoutForm({
  technicianId,
  formattedAmount,
  isDisabled
}: {
  technicianId: string;
  formattedAmount: string;
  isDisabled: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handlePayout(e: React.FormEvent) {
    e.preventDefault();
    
    // Konfirmasi keamanan (Mencegah salah klik)
    if (!confirm(`Yakin ingin mencairkan ${formattedAmount} untuk teknisi ini?`)) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('technicianId', technicianId);

    // [2] Tampilkan indikator loading berputar
    const loadingToast = toast.loading('Memproses pencairan dana...');

    try {
      // Memanggil Server Action
      const res = await payoutTechnician(formData);
      
      // Tutup indikator loading
      toast.dismiss(loadingToast);

      // [3] Tampilkan hasil dengan notifikasi cantik
      if (res.success) {
        toast.success(res.message || '✅ Pencairan Berhasil!');
      } else {
        toast.error(res.message || '❌ Gagal mencairkan dana.');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('⚠️ Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handlePayout} className="w-full">
      <button
        type="submit"
        disabled={isDisabled || isLoading}
        // [4] Mengubah warna tombol jadi Emerald (Hijau Uang) agar lebih intuitif
        className={`w-full px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group
          ${isDisabled || isLoading
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 active:scale-95'
          }`}
      >
        <span className={isDisabled || isLoading ? '' : 'group-hover:animate-bounce'}>
          {isLoading ? '⏳' : '💰'}
        </span>
        {isLoading ? 'Memproses...' : `Cairkan ${formattedAmount}`}
      </button>
    </form>
  );
}