'use client';

import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { deleteExpensePermanent, updateExpenseRecord } from '@/app/actions/manage';

type Expense = {
    id: string;
    amount: number;
    description: string | null;
    kmBefore: number | null;
    kmAfter: number | null;
    status: string;
    expenseDate: Date;
    createdAt: Date;
    user: { name: string; nik: string | null; phone: string | null };
    category: { id: string; name: string };
    approver: { name: string } | null;
    attachments: { id: string; type: string; fileUrl: string; createdAt: Date }[];
};

type Category = {
    id: string;
    name: string;
};

export default function ManageClaimsTable({ expenses, categories }: { expenses: Expense[], categories: Category[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingClaim, setEditingClaim] = useState<Expense | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter berdasarkan pencarian
    const filteredExpenses = useMemo(() => {
        const sorted = [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (!searchQuery.trim()) return sorted;
        const q = searchQuery.toLowerCase();
        return sorted.filter((exp) => {
            const name = exp.user?.name?.toLowerCase() || '';
            const desc = exp.description?.toLowerCase() || '';
            const status = exp.status.toLowerCase();
            const category = exp.category?.name?.toLowerCase() || '';
            const nik = exp.user?.nik?.toLowerCase() || '';
            const amount = String(exp.amount);
            return name.includes(q) || desc.includes(q) || status.includes(q) || category.includes(q) || nik.includes(q) || amount.includes(q);
        });
    }, [expenses, searchQuery]);

    const handleDelete = async (id: string) => {
        if (!confirm('Peringatan Kritis: Apakah Anda yakin ingin menghapus data bon ini secara PERMANEN? Data yang dihapus tidak bisa dikembalikan.')) return;

        setIsDeleting(id);
        const result = await deleteExpensePermanent(id);
        setIsDeleting(null);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateExpenseRecord(formData);

        setIsUpdating(false);

        if (result.success) {
            toast.success(result.message);
            setEditingClaim(null);
        } else {
            toast.error(result.message);
        }
    };

    const formatRp = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    const formatDate = (dateValue: any) => {
        const d = new Date(dateValue);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
        }).format(d) + ' WIB';
    };

    return (
        <div className="space-y-6">

            {/* SEARCH BAR */}
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama teknisi, deskripsi, status, kategori, NIK..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs">✕</button>
                )}
            </div>
            {searchQuery && (
                <p className="text-xs text-slate-400 font-medium -mt-4">Menampilkan {filteredExpenses.length} dari {expenses.length} data</p>
            )}
            {/* TABLE DATA */}
            <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-900/50">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/80 text-slate-300 uppercase text-[10px] font-black tracking-wider">
                        <tr>
                            <th className="px-5 py-4">Tgl Dibuat</th>
                            <th className="px-5 py-4">Teknisi</th>
                            <th className="px-5 py-4">Kategori</th>
                            <th className="px-5 py-4 max-w-[200px]">Deskripsi / Tiket</th>
                            <th className="px-5 py-4">Nominal</th>
                            <th className="px-5 py-4 text-center">KM Sblm/Ssdh</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-slate-300">
                        {filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-5 py-12 text-center text-slate-500 font-medium">Belum ada data riwayat sama sekali.</td>
                            </tr>
                        ) : filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3 text-xs text-slate-400">{formatDate(expense.createdAt)}</td>
                                <td className="px-5 py-3">
                                    <div className="font-bold text-white">{expense.user?.name || '-'}</div>
                                    <div className="text-[10px] text-slate-500">{expense.user?.nik || '-'}</div>
                                </td>
                                <td className="px-5 py-3 font-medium text-slate-400">{expense.category?.name || '-'}</td>
                                <td className="px-5 py-3 text-xs truncate max-w-[200px] text-slate-400" title={expense.description || ''}>
                                    {expense.description || '-'}
                                </td>
                                <td className="px-5 py-3 font-bold text-white">{formatRp(Number(expense.amount))}</td>
                                <td className="px-5 py-3 text-center text-xs font-semibold text-slate-400">
                                    {expense.kmBefore ?? '-'} / {expense.kmAfter ?? '-'}
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${expense.status === 'APPROVED' ? 'bg-indigo-500/10 text-indigo-400' :
                                        expense.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                                            expense.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                                                'bg-amber-500/10 text-amber-400'
                                        }`}>
                                        {expense.status}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right space-x-2">
                                    <button
                                        onClick={() => setEditingClaim(expense)}
                                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-lg transition-all border border-slate-700/50 hover:border-indigo-500/30"
                                        title="Edit Data"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        disabled={isDeleting === expense.id}
                                        className="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-all border border-slate-700/50 hover:border-rose-500/30 disabled:opacity-50"
                                        title="Hapus Permanen"
                                    >
                                        {isDeleting === expense.id ? (
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

            {/* EDIT MODAL */}
            {editingClaim && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] my-auto">
                        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-white">Edit Data Bon</h3>
                                <p className="text-xs font-medium text-slate-400 mt-1">ID: {editingClaim.id.substring(0, 8)}... / User: {editingClaim.user?.name}</p>
                            </div>
                            <button onClick={() => setEditingClaim(null)} className="p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="editClaimForm" onSubmit={handleUpdate} className="space-y-4">
                                <input type="hidden" name="id" value={editingClaim.id} />

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status Laporan</label>
                                    <select name="status" defaultValue={editingClaim.status} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50">
                                        <option value="PENDING">PENDING (Antrean Persetujuan)</option>
                                        <option value="APPROVED">APPROVED (Menunggu Antrean Cair)</option>
                                        <option value="PAID">PAID (Selesai Dibayar)</option>
                                        <option value="REJECTED">REJECTED (Ditolak)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kategori Biaya</label>
                                    <select name="categoryId" defaultValue={editingClaim.category?.id} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium outline-none focus:border-indigo-500 transition-all disabled:opacity-50">
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nominal (Rp)</label>
                                    <input type="number" name="amount" defaultValue={editingClaim.amount} required disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-black text-lg outline-none focus:border-indigo-500 transition-all disabled:opacity-50" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">KM Sebelumm</label>
                                        <input type="number" name="kmBefore" defaultValue={editingClaim.kmBefore ?? ''} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-black outline-none focus:border-indigo-500 transition-all disabled:opacity-50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">KM Sesudah</label>
                                        <input type="number" name="kmAfter" defaultValue={editingClaim.kmAfter ?? ''} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-black outline-none focus:border-indigo-500 transition-all disabled:opacity-50" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deskripsi Pekerjaan / Nomer Tiket</label>
                                    <textarea name="description" defaultValue={editingClaim.description || ''} rows={3} disabled={isUpdating} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-medium outline-none focus:border-indigo-500 transition-all resize-none disabled:opacity-50"></textarea>
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-800/60 bg-slate-900 grid grid-cols-2 gap-3 rounded-b-3xl">
                            <button
                                type="button"
                                onClick={() => setEditingClaim(null)}
                                disabled={isUpdating}
                                className="w-full px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="editClaimForm"
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
