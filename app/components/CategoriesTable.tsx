'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export default function CategoriesTable({ 
  categories, 
  updateCategoryAction, 
  toggleStatusAction, 
  deleteCategoryAction 
}: { 
  categories: Category[];
  updateCategoryAction: (formData: FormData) => Promise<void>;
  toggleStatusAction: (formData: FormData) => Promise<void>;
  deleteCategoryAction: (formData: FormData) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      alert('Nama kategori tidak boleh kosong!');
      return;
    }
    
    setLoading(`update-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('name', editName.trim());
      await updateCategoryAction(formData);
      setEditingId(null);
      showMessage('Kategori berhasil diupdate!');
    } catch (error) {
      alert('Gagal mengupdate kategori');
    } finally {
      setLoading(null);
    }
  };

  const handleToggle = async (id: string) => {
    setLoading(`toggle-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      await toggleStatusAction(formData);
      showMessage('Status kategori berhasil diubah!');
    } catch (error) {
      alert('Gagal mengubah status kategori');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus kategori "${name}"?`)) {
      setLoading(`delete-${id}`);
      try {
        const formData = new FormData();
        formData.append('id', id);
        await deleteCategoryAction(formData);
        showMessage('Kategori berhasil dihapus!');
      } catch (error) {
        alert('Gagal menghapus kategori');
      } finally {
        setLoading(null);
      }
    }
  };


  return (
    <div className="space-y-4">
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-bold">
          ✓ {message}
        </div>
      )}
      
      <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 overflow-hidden relative backdrop-blur-sm">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
                <th className="p-4 pl-6">Nama Kategori</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-16 text-center">
                    <div className="text-5xl mb-4 grayscale opacity-20">📭</div>
                    <p className="text-slate-400 font-bold text-lg">Belum ada kategori</p>
                    <p className="text-slate-500 text-sm mt-1">Silakan tambahkan kategori pertama di form sebelah kiri.</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-800/80 transition-colors">
                    <td className="p-4 pl-6">
                      {editingId === cat.id ? (
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white w-full max-w-xs"
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="font-extrabold text-white text-sm">{cat.name}</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Dibuat: {new Date(cat.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-emerald-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-slate-700/50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-600/50">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === cat.id ? (
                          <>
                            <button 
                              onClick={() => handleUpdate(cat.id)}
                              disabled={loading === `update-${cat.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all disabled:opacity-50"
                            >
                              {loading === `update-${cat.id}` ? '...' : '✓ Simpan'}
                            </button>
                            <button 
                              onClick={cancelEdit}
                              disabled={loading === `update-${cat.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/50 transition-all disabled:opacity-50"
                            >
                              ✕ Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => startEdit(cat)}
                              disabled={loading !== null}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all disabled:opacity-50"
                            >
                              ✏️ Edit
                            </button>

                            <button 
                              onClick={() => handleToggle(cat.id)}
                              disabled={loading === `toggle-${cat.id}`}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                                cat.isActive 
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {loading === `toggle-${cat.id}` ? '...' : (cat.isActive ? 'Nonaktifkan' : 'Aktifkan')}
                            </button>

                            <button 
                              onClick={() => handleDelete(cat.id, cat.name)}
                              disabled={loading === `delete-${cat.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all disabled:opacity-50"
                            >
                              {loading === `delete-${cat.id}` ? '...' : '🗑️ Hapus'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
