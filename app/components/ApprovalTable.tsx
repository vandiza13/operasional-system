'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  type: 'RECEIPT' | 'EVIDENCE_1' | 'EVIDENCE_2' | 'EVIDENCE_3';
  fileUrl: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: Date;
  status: string;
  user: {
    id: string;
    name: string;
    nik?: string | null;
    phone?: string | null;
  } | null;
  kmBefore?: number | null;
  kmAfter?: number | null;
  attachments: Attachment[];
}

export default function ApprovalTable({
  expenses,
  approveAction,
  rejectAction
}: {
  expenses: Expense[];
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk Lightbox Gambar
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const handleApprove = async (id: string, amount: string) => {
    setLoading(`approve-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('amount', amount);
      await approveAction(formData);
      toast.success('Laporan berhasil disetujui!');
    } catch (error) {
      toast.error('Gagal menyetujui laporan');
    } finally {
      setLoading(null);
      setEditingId(null);
    }
  };

  const handleQuickApprove = async (id: string, currentAmount: number) => {
    setLoading(`quick-approve-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('amount', String(currentAmount));
      await approveAction(formData);
      toast.success('Laporan berhasil disetujui!');
    } catch (error) {
      toast.error('Gagal menyetujui laporan');
    } finally {
      setLoading(null);
    }
  };

  const startReject = (expense: Expense) => {
    setRejectingId(expense.id);
    setRejectReason('');
  };

  const cancelReject = () => {
    setRejectingId(null);
    setRejectReason('');
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi!');
      return;
    }

    setLoading(`reject-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('reason', rejectReason);
      await rejectAction(formData);
      toast.success('Laporan berhasil ditolak');
    } catch (error) {
      toast.error('Gagal menolak laporan');
    } finally {
      setLoading(null);
      setRejectingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error('Gagal mendownload file');
      window.open(url, '_blank'); // fallback
    }
  };

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter((item) => {
      const name = item.user?.name?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const amount = String(item.amount);
      const nik = item.user?.nik?.toLowerCase() || '';
      return name.includes(q) || desc.includes(q) || amount.includes(q) || nik.includes(q);
    });
  }, [expenses, searchQuery]);

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 p-16 text-center backdrop-blur-sm">
        <div className="text-6xl mb-4 grayscale opacity-20">🎉</div>
        <p className="text-slate-400 font-bold text-xl">All Clear!</p>
        <p className="text-slate-500 text-sm mt-2">All reports have been verified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* SEARCH BAR */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama teknisi, deskripsi, NIK, atau nominal..."
          className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>
      {searchQuery && (
        <p className="text-xs text-slate-400 font-medium">Menampilkan {filteredExpenses.length} dari {expenses.length} data</p>
      )}
      {/* --- LIGHTBOX MODAL (POP-UP GAMBAR) --- */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setSelectedImg(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center p-4">
            {/* Gambar Utama */}
            <img
              src={selectedImg}
              alt="Evidence Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />

            {/* Tombol Close (Pojok Kanan Atas) */}
            <button
              onClick={() => setSelectedImg(null)}
              className="absolute top-4 right-4 bg-slate-800/80 text-white rounded-full p-2 hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <p className="absolute bottom-4 left-0 right-0 text-center text-slate-400 text-sm pointer-events-none">
              Klik dimana saja untuk menutup
            </p>
          </div>
        </div>
      )}

      {filteredExpenses.map((item) => {
        const receipt = item.attachments?.find((a) => a.type === 'RECEIPT')?.fileUrl;
        const ev1 = item.attachments?.find((a) => a.type === 'EVIDENCE_1')?.fileUrl;
        const ev2 = item.attachments?.find((a) => a.type === 'EVIDENCE_2')?.fileUrl;
        const ev3 = item.attachments?.find((a) => a.type === 'EVIDENCE_3')?.fileUrl;

        return (
          <div
            key={item.id}
            className="bg-slate-800/50 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm hover:border-slate-600/50 transition-colors"
          >
            {/* Header Card */}
            <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg border border-indigo-500/30">
                  👷‍♂️
                </div>
                <div>
                  <p className="font-extrabold text-white text-sm">{item.user?.name || 'Anonymous'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1 flex-wrap">
                    {item.user?.nik ? `NIK: ${item.user.nik}` : 'NIK: -'} •
                    {item.user?.phone ? (
                      <a
                        href={`https://wa.me/${item.user.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                        title="Chat via WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.263 1.996.763 2.864l-1.041 3.841 3.916-1.033c.84.456 1.785.698 2.744.701h.004c3.18 0 5.766-2.585 5.768-5.766-.002-3.18-2.588-5.766-5.766-5.766l-.02-.007zm3.328 8.169c-.183.52-.942 1.011-1.328 1.127-.336.1-.735.15-2.071-.412-1.748-.733-2.912-2.316-2.992-2.428-.08-.112-.705-.968-.705-1.85 0-.882.441-1.314.593-1.482.152-.168.336-.211.448-.211.112 0 .224 0 .32.005.105.006.248-.04.384.295.144.352.488 1.226.528 1.315.04.089.064.192.008.305-.056.113-.088.185-.168.281-.08.096-.168.216-.24.296-.08.089-.168.185-.064.361.104.177.464.78.992 1.25.688.608 1.256.793 1.432.889.176.095.28.08.384-.04.104-.12.448-.52.568-.705.12-.176.24-.144.4-.08.16.056 1.008.48 1.184.568.168.088.28.144.32.224.04.08.04.464-.144.984z" /></svg>
                        <span className="group-hover:underline">{item.user.phone}</span>
                      </a>
                    ) : 'WA: -'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">{formatDate(item.expenseDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20">
                  ⏳ Pending
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom 1: Deskripsi */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</h4>
                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                  {item.description || 'No description'}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">KM Sebelum</p>
                    <p className="text-sm font-bold text-white text-center mt-0.5">{item.kmBefore ?? '-'}</p>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">KM Sesudah</p>
                    <p className="text-sm font-bold text-white text-center mt-0.5">{item.kmAfter ?? '-'}</p>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Bukti Foto (TOMBOL LIGHTBOX) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo Evidence</h4>
                <div className="flex flex-col gap-2">
                  {receipt && (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedImg(receipt)} className="flex-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-indigo-500/30 transition-all text-left truncate">
                        🧾 Foto Bon/Struk (Wajib)
                      </button>
                      <button onClick={() => handleDownload(receipt, `Bon_${item.id}.jpg`)} className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 flex items-center justify-center transition-all" title="Download">
                        ⬇️
                      </button>
                    </div>
                  )}
                  {ev1 && (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedImg(ev1)} className="flex-1 bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 transition-all text-left truncate">
                        📸 KM Sebelum (Wajib)
                      </button>
                      <button onClick={() => handleDownload(ev1, `KMSebelum_${item.id}.jpg`)} className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 flex items-center justify-center transition-all" title="Download">
                        ⬇️
                      </button>
                    </div>
                  )}
                  {ev2 && (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedImg(ev2)} className="flex-1 bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 transition-all text-left truncate">
                        📸 KM Sesudah (Wajib)
                      </button>
                      <button onClick={() => handleDownload(ev2, `KMSesudah_${item.id}.jpg`)} className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 flex items-center justify-center transition-all" title="Download">
                        ⬇️
                      </button>
                    </div>
                  )}
                  {ev3 && (
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedImg(ev3)} className="flex-1 bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 transition-all text-left truncate">
                        📸 Eviden Tambahan
                      </button>
                      <button onClick={() => handleDownload(ev3, `EvidenTambahan_${item.id}.jpg`)} className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600/50 flex items-center justify-center transition-all" title="Download">
                        ⬇️
                      </button>
                    </div>
                  )}
                  {!receipt && !ev1 && !ev2 && !ev3 && (
                    <span className="text-xs text-slate-500 italic">No attachments</span>
                  )}
                </div>
              </div>

              {/* Kolom 3: Nominal & Aksi */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount & Verification</h4>

                {editingId === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Edit Amount (IDR)</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(item.id, editAmount)}
                        disabled={loading === `approve-${item.id}`}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {loading === `approve-${item.id}` ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading === `approve-${item.id}`}
                        className="px-3 py-2 bg-slate-700/50 text-slate-400 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : rejectingId === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Rejection Reason</label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Photo unclear"
                        className="w-full px-3 py-2 bg-slate-950 border border-rose-700 rounded-lg text-sm text-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={loading === `reject-${item.id}`}
                        className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {loading === `reject-${item.id}` ? '...' : '✓ Reject'}
                      </button>
                      <button
                        onClick={cancelReject}
                        disabled={loading === `reject-${item.id}`}
                        className="px-3 py-2 bg-slate-700/50 text-slate-400 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 mb-1">Requested Amount</p>
                      <p className="text-lg font-black text-emerald-400">{formatCurrency(item.amount)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleQuickApprove(item.id, item.amount)}
                        disabled={loading === `quick-approve-${item.id}`}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {loading === `quick-approve-${item.id}` ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        disabled={loading !== null}
                        className="bg-indigo-600/80 hover:bg-indigo-500 text-white px-2 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => startReject(item)}
                        disabled={loading !== null}
                        className="bg-rose-600/80 hover:bg-rose-500 text-white px-2 py-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        🚫 Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}