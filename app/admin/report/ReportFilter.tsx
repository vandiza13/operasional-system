'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function ReportFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Format YYYY-MM-DD local
    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentStartDate = searchParams.get('startDate') || '';
    const currentEndDate = searchParams.get('endDate') || '';
    const currentStatus = searchParams.get('status') || 'APPROVED';

    const [startDate, setStartDate] = useState(currentStartDate);
    const [endDate, setEndDate] = useState(currentEndDate);

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

    function applyFilters(sd: string, ed: string, st: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (sd) params.set('startDate', sd);
        if (ed) params.set('endDate', ed);
        params.set('status', st);

        // Hapus month kalau ada
        params.delete('month');

        router.push(`?${params.toString()}`);
        setIsOpen(false);
    }

    function handleApplyFilter() {
        applyFilters(startDate, endDate, currentStatus);
    }

    function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        applyFilters(currentStartDate, currentEndDate, e.target.value);
    }

    function handleQuickSelectWeek() {
        const today = new Date();
        const day = today.getDay();
        const diffToLastFriday = day >= 5 ? day - 5 : day + 2;

        const lastFriday = new Date(today);
        lastFriday.setDate(today.getDate() - diffToLastFriday);

        const nextThursday = new Date(lastFriday);
        nextThursday.setDate(lastFriday.getDate() + 6);

        const sd = formatDateForInput(lastFriday);
        const ed = formatDateForInput(nextThursday);

        setStartDate(sd);
        setEndDate(ed);
        applyFilters(sd, ed, currentStatus);
    }

    function handleQuickSelectMonth() {
        const now = new Date();
        const sd = formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1));
        const ed = formatDateForInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        setStartDate(sd);
        setEndDate(ed);
        applyFilters(sd, ed, currentStatus);
    }

    // Formatting Helper for Display
    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto h-full">
            {/* FILTER STATUS */}
            <div className="bg-slate-800/80 px-4 h-[52px] rounded-2xl border border-slate-700/80 shadow-sm flex items-center gap-3 hover:bg-slate-800 transition-all">
                <span className="text-xl">📊</span>
                <div className="flex flex-col flex-1 pb-1">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Status Bon</span>
                    <select
                        value={currentStatus}
                        onChange={handleStatusChange}
                        className="bg-transparent text-sm text-white font-bold tracking-wide focus:outline-none appearance-none cursor-pointer pr-6 w-full leading-none"
                    >
                        <option value="ALL" className="bg-slate-800">Semua Status</option>
                        <option value="APPROVED" className="bg-slate-800 text-blue-400">Telah Disetujui (APPROVED)</option>
                        <option value="PAID" className="bg-slate-800 text-emerald-400">Telah Dibayar (PAID)</option>
                        <option value="PENDING" className="bg-slate-800 text-amber-400">Menunggu (PENDING)</option>
                        <option value="REJECTED" className="bg-slate-800 text-rose-400">Ditolak (REJECTED)</option>
                    </select>
                </div>
            </div>

            {/* FILTER TANGGAL */}
            <div ref={containerRef} className="relative z-40 w-full sm:w-auto h-[52px]">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-slate-800/80 hover:bg-slate-700/80 transition-all px-4 h-full rounded-2xl border border-slate-700/80 shadow-sm flex items-center gap-3 cursor-pointer group select-none w-full sm:w-auto min-w-[220px]"
                >
                    <span className="text-xl group-hover:scale-110 transition-transform">📅</span>

                    <div className="flex flex-col text-left flex-1 pb-1">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Rentang Waktu</span>
                        <div className="text-sm text-white font-bold tracking-wide flex items-center leading-none">
                            {currentStartDate && currentEndDate ? `${formatDisplayDate(currentStartDate)} - ${formatDisplayDate(currentEndDate)}` : 'Pilih Rentang Waktu'}
                        </div>
                    </div>

                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                {isOpen && (
                    <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleApplyFilter}
                                disabled={!startDate || !endDate}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                            >
                                Terapkan Tanggal
                            </button>

                            <div className="h-px bg-slate-700/50 w-full my-3"></div>

                            <div className="space-y-2">
                                <button
                                    onClick={handleQuickSelectWeek}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-sm font-medium border border-slate-700 transition"
                                >
                                    Siklus Minggu Ini (Jum-Kam)
                                </button>
                                <button
                                    onClick={handleQuickSelectMonth}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-sm font-medium border border-slate-700 transition"
                                >
                                    Siklus Bulan Ini
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
