'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { payoutTechnician } from '@/app/actions/admin';
import QueueEvidenceViewer from './QueueEvidenceViewer';

const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
const formatDate = (date: Date | string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

// --- KOMPONEN BARIS DESKTOP ---
function QueueRowDesktop({ item, index, currentBalance }: { item: any, index: number, currentBalance: number }) {
    // Default centang semua bon
    const [selectedIds, setSelectedIds] = useState<string[]>(item.expenses.map((e: any) => e.id));
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleToggleAll = () => {
        if (selectedIds.length === item.expenses.length) setSelectedIds([]);
        else setSelectedIds(item.expenses.map((e: any) => e.id));
    };

    const totalSelectedAmount = item.expenses
        .filter((e: any) => selectedIds.includes(e.id))
        .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    const isBalanceSufficient = currentBalance >= totalSelectedAmount;
    const isDisabled = selectedIds.length === 0 || !isBalanceSufficient;

    const handlePayout = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Yakin ingin mencairkan ${selectedIds.length} bon terpilih dengan total ${formatRupiah(totalSelectedAmount)}?`)) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('technicianId', item.technicianId);
        formData.append('expenseIds', JSON.stringify(selectedIds)); // Kirim ID terpilih

        const loadingToast = toast.loading('Memproses pencairan dana...');

        try {
            const res = await payoutTechnician(formData);
            toast.dismiss(loadingToast);
            if (res.success) toast.success(res.message);
            else toast.error(res.message);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Terjadi kesalahan sistem.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <tr className="hover:bg-slate-800/80 transition-colors">
            <td className="p-4 pl-8">
                <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-slate-500">{index + 1}</div>
            </td>
            <td className="p-4">
                <p className="font-extrabold text-white text-base">{item.technicianName}</p>
                <p className="text-[10px] text-slate-400 font-semibold mb-0.5">NIK: {item.technicianNik}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Antrean <span className="text-blue-400 font-bold">{item.expenses.length} Bon</span></p>
            </td>
            <td className="p-4 min-w-[350px] whitespace-normal">
                <details className="group cursor-pointer">
                    <summary className="text-indigo-400 hover:text-indigo-300 font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-lg w-max transition-colors outline-none list-none flex items-center gap-2">
                        Pilih & Lihat Rincian <span>⬇</span>
                    </summary>
                    <div className="mt-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/50 shadow-inner">
                        {/* Tombol Pilih Semua */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-300 hover:text-white transition-colors">
                                <input type="checkbox" checked={selectedIds.length === item.expenses.length} onChange={handleToggleAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                                Pilih Semua Bon ({item.expenses.length})
                            </label>
                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{selectedIds.length} Terpilih</span>
                        </div>
                        {/* List Bon */}
                        <ul className="space-y-3 text-[11px] text-slate-300">
                            {item.expenses.map((e: any) => (
                                <li key={e.id} className="flex justify-between items-center gap-3 border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                                    <label className="flex items-start gap-3 w-full cursor-pointer group/item">
                                        <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => handleToggle(e.id)} className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer flex-shrink-0" />
                                        <div className="flex flex-col flex-1">
                                            <span className="font-medium text-white line-clamp-2 group-hover/item:text-indigo-300 transition-colors" title={e.description}>{e.description || 'Tanpa Keterangan'}</span>
                                            {e.vehiclePlate && <span className="text-[9px] font-black text-indigo-400 mt-0.5 uppercase tracking-wider">🚗 {e.vehiclePlate}</span>}
                                            <div className="flex items-center gap-2 mt-1.5" onClick={(ev) => ev.preventDefault()}>
                                                <span className="text-[9px] text-slate-500 font-bold">{formatDate(e.expenseDate)}</span>
                                                <QueueEvidenceViewer attachments={e.attachments} />
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700/50 whitespace-nowrap">{formatRupiah(Number(e.amount))}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </details>
            </td>
            <td className="p-4">
                <p className={`text-xl font-black tracking-tight transition-colors ${selectedIds.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {formatRupiah(totalSelectedAmount)}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Total {selectedIds.length} Bon Dicairkan</p>
            </td>
            <td className="p-4 pr-8">
                <button onClick={handlePayout} disabled={isDisabled || isLoading} className={`w-full px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group ${isDisabled || isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 active:scale-95'}`}>
                    <span className={isDisabled || isLoading ? '' : 'group-hover:animate-bounce'}>{isLoading ? '⏳' : '💰'}</span>
                    {isLoading ? 'Memproses...' : `Cairkan Dana`}
                </button>
                {!isBalanceSufficient && selectedIds.length > 0 && <p className="text-[10px] text-red-400 font-bold mt-2 text-center animate-pulse">⚠️ Saldo Kas Tidak Cukup!</p>}
                {selectedIds.length === 0 && <p className="text-[10px] text-slate-500 font-medium mt-2 text-center">Pilih minimal 1 bon</p>}
            </td>
        </tr>
    );
}

// --- KOMPONEN KARTU MOBILE ---
function QueueCardMobile({ item, index, currentBalance }: { item: any, index: number, currentBalance: number }) {
    const [selectedIds, setSelectedIds] = useState<string[]>(item.expenses.map((e: any) => e.id));
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleToggleAll = () => {
        if (selectedIds.length === item.expenses.length) setSelectedIds([]);
        else setSelectedIds(item.expenses.map((e: any) => e.id));
    };

    const totalSelectedAmount = item.expenses.filter((e: any) => selectedIds.includes(e.id)).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const isBalanceSufficient = currentBalance >= totalSelectedAmount;
    const isDisabled = selectedIds.length === 0 || !isBalanceSufficient;

    const handlePayout = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Yakin mencairkan ${selectedIds.length} bon terpilih?`)) return;
        setIsLoading(true);
        const formData = new FormData();
        formData.append('technicianId', item.technicianId);
        formData.append('expenseIds', JSON.stringify(selectedIds));
        const loadingToast = toast.loading('Memproses pencairan...');
        try {
            const res = await payoutTechnician(formData);
            toast.dismiss(loadingToast);
            if (res.success) toast.success(res.message);
            else toast.error(res.message);
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Terjadi kesalahan sistem.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col overflow-hidden relative">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-700/50 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Antrean #{index + 1}</span>
                <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-500/20">{item.expenses.length} Bon Masuk</span>
            </div>
            <div className="p-5 flex flex-col gap-1 border-b border-slate-800/60">
                <h3 className="font-extrabold text-white text-lg">{item.technicianName}</h3>
                <p className="text-xs text-slate-400 font-semibold">NIK: {item.technicianNik}</p>
            </div>
            <div className="p-5 bg-slate-900/40 border-b border-slate-800/60">
                <details className="group cursor-pointer">
                    <summary className="text-indigo-400 hover:text-indigo-300 font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl w-full flex items-center justify-between transition-colors outline-none list-none shadow-sm">
                        Pilih Rincian Bon <span className="text-lg group-open:rotate-180 transition-transform">▾</span>
                    </summary>
                    <div className="mt-3 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-300">
                                <input type="checkbox" checked={selectedIds.length === item.expenses.length} onChange={handleToggleAll} className="w-5 h-5 rounded accent-indigo-500" />
                                Pilih Semua ({item.expenses.length})
                            </label>
                        </div>
                        <ul className="space-y-4 text-[11px] text-slate-300">
                            {item.expenses.map((e: any) => (
                                <li key={e.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                                    <label className="flex items-start gap-3 w-full cursor-pointer">
                                        <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => handleToggle(e.id)} className="mt-0.5 w-5 h-5 rounded accent-indigo-500 flex-shrink-0" />
                                        <div className="flex flex-col flex-1 pt-0.5">
                                            <span className="font-medium leading-relaxed text-white">{e.description || 'Tidak ada keterangan'}</span>
                                            {e.vehiclePlate && <span className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-wider">🚗 Plat: {e.vehiclePlate}</span>}
                                            <div className="flex items-center gap-3 mt-1.5" onClick={ev => ev.preventDefault()}>
                                                <span className="text-[9px] text-slate-500 font-semibold">{formatDate(e.expenseDate)}</span>
                                                <QueueEvidenceViewer attachments={e.attachments} />
                                            </div>
                                        </div>
                                        <span className="font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-700/50 mt-0.5">{formatRupiah(Number(e.amount))}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </details>
            </div>
            <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-end border-b border-slate-800 border-dashed pb-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Terpilih</p>
                        <p className="text-[10px] text-indigo-400 font-bold mt-0.5">{selectedIds.length} Bon</p>
                    </div>
                    <p className={`text-2xl font-black tracking-tight ${selectedIds.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{formatRupiah(totalSelectedAmount)}</p>
                </div>
                <div>
                    <button onClick={handlePayout} disabled={isDisabled || isLoading} className={`w-full px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 group ${isDisabled || isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50 active:scale-95'}`}>
                        <span className={isDisabled || isLoading ? '' : 'group-hover:animate-bounce'}>{isLoading ? '⏳' : '💰'}</span>
                        {isLoading ? 'Memproses...' : `Cairkan Dana`}
                    </button>
                    {!isBalanceSufficient && selectedIds.length > 0 && <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex justify-center gap-2"><span className="animate-pulse">⚠️</span><span className="text-[10px] font-bold text-red-400">Saldo Kas Tidak Mencukupi</span></div>}
                </div>
            </div>
        </div>
    );
}

// --- KOMPONEN UTAMA EXPORT ---
export default function QueueListClient({ payoutsArray, currentBalance }: { payoutsArray: any[], currentBalance: number }) {
    if (payoutsArray.length === 0) {
        return (
            <div className="p-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
                <div className="text-5xl mb-4 grayscale opacity-20">💸</div>
                <p className="text-slate-400 font-bold text-lg">Antrean Bersih!</p>
                <p className="text-slate-500 text-sm mt-1">Tidak ada hutang, semua dana sukses dicairkan.</p>
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto p-2 hidden md:block">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
                            <th className="p-4 pl-8 w-16">No</th>
                            <th className="p-4">Identitas Teknisi</th>
                            <th className="p-4">Pilih Bon Pencairan</th>
                            <th className="p-4">Total Dicairkan</th>
                            <th className="p-4 pr-8 text-center min-w-[200px]">Aksi Transfer</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {payoutsArray.map((item, index) => (
                            <QueueRowDesktop key={item.technicianId} item={item} index={index} currentBalance={currentBalance} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden flex flex-col gap-4 p-4 mt-2">
                {payoutsArray.map((item, index) => (
                    <QueueCardMobile key={item.technicianId} item={item} index={index} currentBalance={currentBalance} />
                ))}
            </div>
        </>
    );
}