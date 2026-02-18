'use client'

import { useState } from 'react';
import { topUpLedger } from '@/app/actions/admin';

export default function TopUpModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await topUpLedger(formData);

    if (res.success) {
      alert('✅ ' + res.message);
      setIsOpen(false);
    } else {
      alert('❌ Gagal: ' + res.message);
    }
    setIsLoading(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95 flex items-center gap-2"
      >
        <span>➕</span> Catat Dana Masuk
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
              <span className="text-2xl">🏦</span> Top-Up Saldo Kas
            </h3>
            <p className="text-sm text-slate-400 mb-6">Masukkan nominal dana yang diterima dari Pusat untuk operasional.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1"
                  placeholder="Contoh: 10000000"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">Keterangan / Sumber Dana</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  placeholder="Contoh: Dana Operasional Februari"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}