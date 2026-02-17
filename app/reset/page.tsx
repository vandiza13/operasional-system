'use client'

import { useState, useEffect } from 'react';

interface DatabaseStatus {
  success: boolean;
  statistics?: {
    total_users: number;
    total_expenses: number;
  };
  users?: Array<{ id: string; name: string; email: string; role: string }>;
  message?: string;
  deletedRecords?: {
    users: number;
    expenses: number;
    attachments: number;
    categories: number;
  };
}

export default function ResetPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Fetch database status on load
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reset');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWipeDatabase = async () => {
    if (!confirmed || !window.confirm('⚠️ YAKIN INGIN HAPUS SEMUA DATA?\n\nIni tidak bisa di-undo!')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'WIPE_ALL_DATA' })
      });
      const data = await res.json();
      alert('✅ ' + data.message);
      setConfirmed(false);
      checkStatus();
    } catch (error) {
      alert('❌ Error: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-4xl">🗑️</span> Manajemen Database
          </h1>
          <p className="text-slate-400 mt-2">Panel kontrol untuk monitoring dan reset database</p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900/80 rounded-3xl shadow-lg border border-slate-800 p-6 md:p-8 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl border border-indigo-500/20">📊</span> 
            Status Database
          </h2>
          
          {loading && status === null ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-slate-400 font-medium">Loading...</span>
            </div>
          ) : status?.success ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total User</p>
                  <p className="text-3xl font-black text-white">{status.statistics?.total_users || 0}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Expenses</p>
                  <p className="text-3xl font-black text-white">{status.statistics?.total_expenses || 0}</p>
                </div>
              </div>

              {status.users && status.users.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Pengguna di Database</h3>
                  <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 text-xs font-bold uppercase border-b border-slate-700/50">
                          <th className="p-4">Nama</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {status.users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-semibold text-white">{user.name}</td>
                            <td className="p-4 text-slate-400 text-sm">{user.email}</td>
                            <td className="p-4">
                              <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg ${
                                user.role === 'SUPER_ADMIN' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                user.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <p className="text-rose-400 font-bold flex items-center gap-2">
                <span>❌</span> Error: {status?.message}
              </p>
            </div>
          )}
        </div>

        {/* Wipe Database Card */}
        <div className="bg-rose-950/30 rounded-3xl shadow-lg border border-rose-500/30 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
          
          <h2 className="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
            <span className="bg-rose-500/20 text-rose-400 p-2 rounded-xl border border-rose-500/20">⚠️</span> 
            Zona Bahaya: Hapus Database
          </h2>
          
          <p className="text-rose-400/80 font-medium mb-6">
            Ini akan MENGHAPUS semua user, expenses, attachments, dan kategori. Tindakan ini TIDAK BISA dibatalkan!
          </p>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={loading}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-500/20 focus:ring-2"
              />
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                Saya mengerti ini akan menghapus semua data secara permanen
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleWipeDatabase}
              disabled={!confirmed || loading}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                confirmed && !loading
                  ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-lg shadow-rose-900/50 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Memproses...
                </span>
              ) : (
                '🗑️ HAPUS SEMUA DATA'
              )}
            </button>

            <button
              onClick={checkStatus}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh Status
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-600 font-medium">
            Sistem Operasional Internal © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
