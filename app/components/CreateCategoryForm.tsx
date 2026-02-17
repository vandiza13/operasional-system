'use client';

import { useState } from 'react';

export default function CreateCategoryForm({ 
  createAction 
}: { 
  createAction: (formData: FormData) => Promise<void> 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      await createAction(formData);
      setSuccess('Kategori berhasil ditambahkan!');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kategori');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm sticky top-28">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
      
      <h2 className="text-xl font-extrabold text-white mb-1 flex items-center">
        <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl mr-3 shadow-sm border border-indigo-500/20">➕</span> Tambah Kategori
      </h2>
      <p className="text-sm text-slate-400 mb-6 font-medium">Buat kategori pengeluaran baru.</p>

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-bold">
          ✗ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold">
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-400 ml-1">Nama Kategori</label>
          <input 
            type="text" 
            name="name" 
            required 
            disabled={loading}
            placeholder="Contoh: Bensin, Konsumsi, dll"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white text-sm outline-none transition-all placeholder:text-slate-600 disabled:opacity-50" 
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-95 shadow-indigo-900/50 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kategori 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}
