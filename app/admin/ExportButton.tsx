'use client'

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ExportButton() {
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = () => {
    setIsDownloading(true);
    
    // Ambil bulan dari URL (jika ada), kalau tidak ada API akan pakai bulan ini
    const month = searchParams.get('month') || '';
    
    // Trigger download langsung ke API
    // Kita gunakan window.location.href agar browser menangani download stream file
    window.location.href = `/api/export?month=${month}`;

    // Reset loading setelah beberapa saat (karena kita tidak dapat feedback dari window.location)
    setTimeout(() => setIsDownloading(false), 3000);
  };

  return (
    <button
      onClick={handleExport}
      disabled={isDownloading}
      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/50 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isDownloading ? (
        <>
          <span className="animate-spin">⏳</span> Mengunduh...
        </>
      ) : (
        <>
          <span>📊</span> Export Excel
        </>
      )}
    </button>
  );
}