'use client';

import { useState } from 'react';

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
  } | null;
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
    } catch (error) {
      alert('Failed to approve report');
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
    } catch (error) {
      alert('Failed to approve report');
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
      alert('Rejection reason is required!');
      return;
    }
    
    setLoading(`reject-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('reason', rejectReason);
      await rejectAction(formData);
    } catch (error) {
      alert('Failed to reject report');
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
      {expenses.map((item) => {
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
                  <p className="text-xs text-slate-500 font-medium">{formatDate(item.expenseDate)}</p>
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
              </div>


              {/* Kolom 2: Bukti Foto */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo Evidence</h4>
                <div className="flex flex-wrap gap-2">
                  {receipt && (
                    <a 
                      href={receipt} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-2"
                    >
                      🧾 Main Receipt
                    </a>
                  )}
                  {ev1 && (
                    <a 
                      href={ev1} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-600/50 flex items-center gap-2"
                    >
                      📸 Evidence 1
                    </a>
                  )}
                  {ev2 && (
                    <a 
                      href={ev2} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-600/50 flex items-center gap-2"
                    >
                      📸 Evidence 2
                    </a>
                  )}
                  {ev3 && (
                    <a 
                      href={ev3} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-600/50 flex items-center gap-2"
                    >
                      📸 Evidence 3
                    </a>
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
