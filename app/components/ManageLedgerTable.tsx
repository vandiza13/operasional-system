'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { addLedgerEntry, deleteLedgerEntry, updateLedgerEntry } from '@/app/actions/ledger';

type LedgerEntry = {
    id: string;
    type: string;
    amount: string; // Serialized Decimal
    balance: string; // Serialized Decimal
    description: string;
    createdAt: Date;
    payoutBatchId: string | null;
    admin: { name: string };
};

export default function ManageLedgerTable({ ledgers, currentBalance }: { ledgers: LedgerEntry[], currentBalance: number }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLedger, setEditingLedger] = useState<LedgerEntry | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sorting: newest first 
    const sortedLedgers = [...ledgers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const handleDelete = async (id: string, isAutomatedBatch: boolean) => {
        if (isAutomatedBatch) {
            toast.error('Gagal: Entri Kredit ini adalah hasil pencairan Bon otomatis. Gunakan menu "Kelola Bon" untuk menghapusnya.');
            return;
        }

        if (!confirm('Peringatan: Apakah Anda yakin ingin menghapus data suntikan kas ini secara permanen? Jika dihapus, tatanan sisa saldo kas sistem di atas baris ini akan dikalkulasi ulang menyesuaikan pembatalan.')) return;

        setIsDeleting(id);
        const result = await deleteLedgerEntry(id);
        setIsDeleting(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleCreateTopUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const result = await addLedgerEntry(formData);

        setIsSubmitting(false);

        if (result.success) {
            toast.success(result.message);
            setIsAddingMode(false);
        } else {
            toast.error(result.message);
        }
    };

    const handleUpdateLedger = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateLedgerEntry(formData);

        setIsUpdating(false);

        if (result.success) {
            toast.success(result.message);
            setEditingLedger(null);
        } else {
            toast.error(result.message);
        }
    };

    const formatRp = (angkaStr: string | number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(angkaStr));

    const formatDate = (dateValue: any) => {
        const d = new Date(dateValue);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
        }).format(d) + ' WIB';
    };

    return (
        <div className="space-y-6">

            {/* HEADER ACTION AREA */}
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                <div>
                    <h3 className="text-lg font-black text-white">Log Transaksi Kas</h3>
                    <p className="text-sm text-slate-400">Total {sortedLedgers.length} riwayat tercatat.</p>
                </div>
                <button
                    onClick={() => setIsAddingMode(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/40 flex items-center gap-2"
                >
                    <span>➕</span> Tambah Saldo (Top-Up)
                </button>
            </div>

            {/* TABLE DATA */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-900/50">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                            <th className="px-5 py-4">Tgl Transaksi</th>
                            <th className="px-5 py-4">Sifat Transaksi</th>
                            <th className="px-5 py-4">Deskripsi / Keterangan</th>
                            <th className="px-5 py-4">Oleh Admin</th>
                            <th className="px-5 py-4 text-right">Nominal Uang</th>
                            <th className="px-5 py-4 text-right border-l border-slate-700/50">Sisa Saldo Kas Aktual</th>
                            <th className="px-5 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-slate-300">
                        {sortedLedgers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-slate-500 font-medium">Buku kas masih benar-benar kosong.</td>
                            </tr>
                        ) : sortedLedgers.map((ledger) => (
                            <tr key={ledger.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3 text-xs text-slate-400">{formatDate(ledger.createdAt)}</td>
                                <td className="px-5 py-3">
                                    {ledger.type === 'TOP_UP' ? (
                                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                            DEBIT (MASUK)
                                        </span>
                                    ) : (
                                        <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                            KREDIT (KELUAR)
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-sm max-w-[250px] truncate text-slate-300" title={ledger.description}>
                                    {ledger.description}
                                    {ledger.payoutBatchId && (
                                        <span className="ml-2 bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">Laporan Dibayar</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-xs font-semibold text-slate-400">{ledger.admin?.name || '-'}</td>

                                {/* NOMINAL UANG TRANSAKSI - TAMPILKAN WARNA BERBEDA BERDASAR SIFAT MUTASI */}
                                <td className={`px-5 py-3 font-bold text-right ${ledger.type === 'TOP_UP' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {ledger.type === 'TOP_UP' ? '+' : '-'} {formatRp(ledger.amount)}
                                </td>

                                <td className="px-5 py-3 font-black text-white text-right border-l border-slate-700/50 bg-slate-800/20">
                                    {formatRp(ledger.balance)}
                                </td>

                                <td className="px-5 py-3 text-center space-x-2">
                                    <button
                                        onClick={() => setEditingLedger(ledger)}
                                        disabled={!!ledger.payoutBatchId}
                                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-all border border-slate-700/50 hover:border-indigo-500/30 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 disabled:hover:border-slate-700/50"
                                        title={ledger.payoutBatchId ? 'Laporan Otomatis tidak dapat diedit.' : 'Edit Transaksi Ini'}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ledger.id, !!ledger.payoutBatchId)}
                                        disabled={isDeleting === ledger.id || !!ledger.payoutBatchId}
                                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all border border-slate-700/50 hover:border-rose-500/30 disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 disabled:hover:border-slate-700/50"
                                        title={ledger.payoutBatchId ? 'Hanya Kas Mutasi Manual yang bisa dihapus lewat halaman ini.' : 'Batalkan (Hapus) Kas Masuk ini'}
                                    >
                                        {isDeleting === ledger.id ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-rose-500 animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE TOP UP MODAL (Sistem Uang Masuk Debit) */}
            {isAddingMode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] my-auto">
                        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white">Top-Up Saldo Kas</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">Suntik kembali dompet dengan uang segar.</p>
                            </div>
                            <button onClick={() => setIsAddingMode(false)} className="p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 flex-1">
                            <form id="addLedgerForm" onSubmit={handleCreateTopUp} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nominal Bantuan Tunai (Rp)</label>
                                    <input type="number" name="amount" min="1" required disabled={isSubmitting} placeholder="Contoh: 1500000" className="w-full px-4 py-3 border border-emerald-500/50 bg-emerald-500/5 rounded-xl text-emerald-400 font-black text-xl outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-emerald-900/40 disabled:opacity-50" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deskripsi/Asal Usul Dana</label>
                                    <textarea name="description" required rows={3} disabled={isSubmitting} placeholder="Mencairkan dana bulanan PT dari Rekening BCA" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-medium outline-none focus:border-indigo-500 transition-all resize-none disabled:opacity-50"></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-800/60 bg-slate-900 rounded-b-3xl">
                            <button
                                type="submit"
                                form="addLedgerForm"
                                disabled={isSubmitting}
                                className="w-full px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        Menyimpan Data...
                                    </>
                                ) : (
                                    'Suntikkan Dana ke Buku Kas'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT LEDGER MODAL */}
            {editingLedger && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] my-auto">
                        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white">Edit Transaksi Kas</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">ID: {editingLedger.id.substring(0, 8)}...</p>
                            </div>
                            <button onClick={() => setEditingLedger(null)} className="p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 flex-1">
                            <form id="editLedgerForm" onSubmit={handleUpdateLedger} className="space-y-5">
                                <input type="hidden" name="id" value={editingLedger.id} />

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Koreksi Nominal (Rp)</label>
                                    <input type="number" name="amount" min="1" defaultValue={editingLedger.amount} disabled={isUpdating} required className="w-full px-4 py-3 border border-indigo-500/50 bg-indigo-500/5 rounded-xl text-indigo-400 font-black text-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-indigo-900/40 disabled:opacity-50" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Revisi Deskripsi Dana</label>
                                    <textarea name="description" required rows={3} defaultValue={editingLedger.description} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-medium outline-none focus:border-indigo-500 transition-all resize-none disabled:opacity-50"></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-800/60 bg-slate-900 grid grid-cols-2 gap-3 rounded-b-3xl">
                            <button
                                type="button"
                                onClick={() => setEditingLedger(null)}
                                disabled={isUpdating}
                                className="w-full px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="editLedgerForm"
                                disabled={isUpdating}
                                className="w-full px-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
