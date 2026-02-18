'use client'

import { useState } from 'react';
import { payoutTechnician } from '@/app/actions/admin';

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
    
    // Konfirmasi ganda untuk menghindari salah klik
    if (!confirm(`Yakin ingin mencairkan ${formattedAmount} untuk teknisi ini?`)) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('technicianId', technicianId);

    // Memanggil Server Action
    const res = await payoutTechnician(formData);
    
    // Menampilkan Notifikasi
    if (res.success) {
      alert('✅ BERHASIL: ' + res.message);
    } else {
      alert('❌ GAGAL: ' + res.message);
    }
    
    setIsLoading(false);
  }

  return (
    <form onSubmit={handlePayout} className="w-full">
      <button
        type="submit"
        disabled={isDisabled || isLoading}
        className={`w-full px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group
          ${isDisabled || isLoading
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50 active:scale-95'
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