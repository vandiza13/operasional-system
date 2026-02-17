'use client';

import { useState } from 'react';

interface Technician {
  id: string;
  name: string;
  email: string;
  nik: string | null;
  phone: string | null;
  position: string | null;
}

export default function EditTechnicianModal({ 
  technician, 
  onClose, 
  onSave 
}: { 
  technician: Technician; 
  onClose: () => void;
  onSave: (formData: FormData) => void;
}) {
  const [formData, setFormData] = useState({
    name: technician.name,
    email: technician.email,
    nik: technician.nik || '',
    phone: technician.phone || '',
    position: technician.position || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('id', technician.id);
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('nik', formData.nik);
    data.append('phone', formData.phone);
    data.append('position', formData.position);
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">✏️</span>
          Edit Teknisi
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required 
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">NIK</label>
            <input 
              type="text" 
              value={formData.nik}
              onChange={(e) => setFormData({...formData, nik: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">No. HP</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 ml-1">Jabatan</label>
            <input 
              type="text" 
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
