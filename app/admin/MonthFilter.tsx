'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambil bulan dari URL, jika tidak ada gunakan bulan saat ini
  const currentMonthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = currentMonthParam.split('-');

  // State local untuk display menu dropdown
  const [selectedYear, setSelectedYear] = useState(parseInt(yearStr, 10));

  // Menutup menu jika user klik area luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectMonth(monthIndex: number) {
    const monthFormatted = (monthIndex + 1).toString().padStart(2, '0');
    const newValue = `${selectedYear}-${monthFormatted}`;

    const params = new URLSearchParams(searchParams.toString());
    params.set('month', newValue);
    router.push(`?${params.toString()}`);
    setIsOpen(false);
  }

  const monthName = MONTHS[parseInt(monthStr, 10) - 1];

  return (
    <div ref={containerRef} className="relative z-50">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800/80 hover:bg-slate-700/80 transition-all px-4 py-2.5 rounded-xl border border-slate-700 shadow-sm flex items-center gap-3 cursor-pointer group select-none"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">📅</span>

        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Filter Laporan</span>
          <div className="text-sm text-white font-bold tracking-wide flex items-center">
            {monthName} <span className="text-indigo-400 mx-1.5 font-black">|</span> {yearStr}
          </div>
        </div>

        {/* Panah Indikator */}
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between mb-4 bg-slate-800/50 p-1.5 rounded-xl">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedYear(prev => prev - 1); }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="font-black text-white px-4">{selectedYear}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedYear(prev => prev + 1); }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m, idx) => {
              const isCurrentSelected = selectedYear === parseInt(yearStr, 10) && idx === parseInt(monthStr, 10) - 1;
              return (
                <button
                  key={m}
                  onClick={(e) => { e.stopPropagation(); handleSelectMonth(idx); }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${isCurrentSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  {m.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}