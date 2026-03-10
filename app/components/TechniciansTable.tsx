'use client';

import { useState, useMemo } from 'react';
import EditTechnicianModal from './EditTechnicianModal';

interface Technician {
  id: string;
  name: string;
  email: string;
  nik: string | null;
  phone: string | null;
  position: string | null;
  createdAt: Date;
}

export default function TechniciansTable({
  technicians,
  editTechnicianAction,
  resetPasswordAction
}: {
  technicians: Technician[];
  editTechnicianAction: (formData: FormData) => Promise<void>;
  resetPasswordAction: (formData: FormData) => Promise<void>;
}) {
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTechnicians = useMemo(() => {
    if (!searchQuery.trim()) return technicians;
    const q = searchQuery.toLowerCase();
    return technicians.filter((t) => {
      const name = t.name.toLowerCase();
      const nik = t.nik?.toLowerCase() || '';
      const email = t.email.toLowerCase();
      const phone = t.phone?.toLowerCase() || '';
      const position = t.position?.toLowerCase() || '';
      return name.includes(q) || nik.includes(q) || email.includes(q) || phone.includes(q) || position.includes(q);
    });
  }, [technicians, searchQuery]);

  const handleEdit = async (formData: FormData) => {
    await editTechnicianAction(formData);
  };

  const handleReset = async (technicianId: string, technicianName: string) => {
    const formData = new FormData();
    formData.append('id', technicianId);
    formData.append('newPassword', 'password123');
    if (confirm(`Yakin ingin reset password ${technicianName} ke "password123"?`)) {
      await resetPasswordAction(formData);
    }
  };

  return (
    <>
      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, NIK, email, HP, atau jabatan..."
          className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>
      {searchQuery && (
        <p className="text-xs text-slate-400 font-medium mb-4">Menampilkan {filteredTechnicians.length} dari {technicians.length} teknisi</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredTechnicians.map((tech) => (
          <div key={tech.id} className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50 shadow-lg hover:shadow-purple-900/20 hover:border-purple-500/30 transition-all group flex flex-col justify-between backdrop-blur-sm relative overflow-hidden">

            {/* Efek Glow Tipis */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl border border-slate-700/50 shadow-inner">
                  👷‍♂️
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/20">Aktif</span>
              </div>
              <h4 className="font-extrabold text-white text-lg leading-tight">{tech.name}</h4>
              <p className="text-xs font-bold text-purple-400 mt-1">{tech.position || 'Teknisi Umum'}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-700/50 space-y-2 relative z-10">
              <div className="flex items-center text-xs font-semibold text-slate-400 gap-2">
                <span className="text-slate-500">🆔</span> {tech.nik || 'Belum ada NIK'}
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-400 gap-2">
                <span className="text-slate-500">📱</span> {tech.phone || 'Belum ada No. HP'}
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-400 gap-2">
                <span className="text-slate-500">✉️</span> {tech.email}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2 relative z-10">
              {/* Edit Teknisi */}
              <button
                onClick={() => setEditingTechnician(tech)}
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all"
              >
                ✏️ Edit
              </button>

              {/* Reset Password */}
              <button
                onClick={() => handleReset(tech.id, tech.name)}
                className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                title="Reset Password ke: password123"
              >
                🔑 Reset
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingTechnician && (
        <EditTechnicianModal
          technician={editingTechnician}
          onClose={() => setEditingTechnician(null)}
          onSave={handleEdit}
        />
      )}
    </>
  );
}
