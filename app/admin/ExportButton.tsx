'use client'

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ExportButton() {
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = () => {
    setIsDownloading(true);

    // Ambil startDate & endDate dari URL, atau pakai bulan/minggu ini jika belum ada
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // Parameter dikirim ke API, kita tambahkan status=APPROVED secara eksplisit jika perlu
    // Tapi karena sudah di API, kita cukup kirimkan parameternya
    let exportUrl = `/api/export?status=APPROVED`;
    if (startDate && endDate) {
      exportUrl += `&startDate=${startDate}&endDate=${endDate}`;
    }

    // Trigger download langsung ke API
    window.location.href = exportUrl;

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