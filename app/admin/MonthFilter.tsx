'use client'

import { useRouter, useSearchParams } from 'next/navigation';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil bulan dari URL, jika tidak ada gunakan bulan saat ini
  const currentMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  function handleMonthChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return; // Cegah error jika user menekan "clear"
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', e.target.value);
    router.push(`?${params.toString()}`);
  }

  // Pecah string "2026-02" menjadi "2026" dan nama bulan "Februari"
  const [year, month] = currentMonth.split('-');
  const monthName = MONTHS[parseInt(month, 10) - 1];

  return (
    <div className="relative bg-slate-800/80 hover:bg-slate-700/80 transition-all px-4 py-2.5 rounded-xl border border-slate-700 shadow-sm flex items-center gap-3 cursor-pointer group overflow-hidden">
      <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
      
      <div className="flex flex-col text-left">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Filter Laporan</span>
        <div className="text-sm text-white font-bold tracking-wide flex items-center">
          {monthName} <span className="text-indigo-400 mx-1.5 font-black">|</span> {year}
        </div>
      </div>

      {/* Trik Input Gaib (Invisible): Tetap bisa diklik tapi tidak merusak UI */}
      <input
        type="month"
        value={currentMonth}
        onChange={handleMonthChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}