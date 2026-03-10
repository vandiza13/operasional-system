'use client'

import { useState } from 'react';

export default function ExportButton({
    startDate,
    endDate,
    status
}: {
    startDate: string;
    endDate: string;
    status: string;
}) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleExport = () => {
        setIsDownloading(true);

        // Rangkai URL Export
        let exportUrl = `/api/export?status=${status}`;
        if (startDate && endDate) {
            exportUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }

        // Trigger download langsung ke API
        window.location.href = exportUrl;

        // Reset loading setelah beberapa saat
        setTimeout(() => setIsDownloading(false), 3000);
    };

    return (
        <button
            onClick={handleExport}
            disabled={isDownloading || !startDate || !endDate}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 
        ${isDownloading || !startDate || !endDate
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 active:scale-95'
                }`}
        >
            {isDownloading ? (
                <>
                    <span className="animate-spin">⏳</span> Mengekstrak...
                </>
            ) : (
                <>
                    <span>📊</span> Download Excel
                </>
            )}
        </button>
    );
}
