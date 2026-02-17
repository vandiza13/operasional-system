'use client';

export default function DeleteButton({ 
  itemId, 
  itemName = 'item ini',
  className = ''
}: { 
  itemId: string;
  itemName?: string;
  className?: string;
}) {
  return (
    <button 
      type="submit"
      className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all ${className}`}
      title={`Hapus ${itemName}`}
      onClick={(e) => {
        if (!confirm(`Yakin ingin menghapus ${itemName}?`)) {
          e.preventDefault();
        }
      }}
    >
      🗑️ Hapus
    </button>
  );
}
