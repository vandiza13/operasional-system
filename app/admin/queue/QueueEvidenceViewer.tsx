'use client';

import { useState } from 'react';

export default function QueueEvidenceViewer({ attachments }: { attachments: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return <span className="text-[9px] text-slate-600 italic border border-slate-800 px-1.5 py-0.5 rounded">Tanpa Foto</span>;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded border border-indigo-500/20 transition-colors flex items-center gap-1"
      >
        <span>📸</span> Cek Bukti
      </button>

      {/* MODAL LIST BUKTI (Thumbnails Menu) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h3 className="text-sm font-black text-white">Daftar Foto Bukti</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">✖</button>
            </div>
            <div className="p-5 flex flex-col gap-2.5">
              {attachments.map((att) => (
                <button
                  key={att.id}
                  onClick={() => setSelectedImg(att.fileUrl)}
                  className="bg-slate-800/50 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl text-xs font-bold border border-slate-700 transition-all text-left flex items-center gap-2"
                >
                  <span className="text-lg">{att.type === 'RECEIPT' ? '🧾' : '📸'}</span>
                  {att.type === 'RECEIPT' ? 'Foto Bon / Struk' : att.type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN (Pop-up Gambar Sesungguhnya) */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in zoom-in-95 duration-200" 
          onClick={() => setSelectedImg(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img src={selectedImg} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <button onClick={() => setSelectedImg(null)} className="absolute top-4 right-4 bg-slate-800/80 text-white rounded-full p-2 hover:bg-rose-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}