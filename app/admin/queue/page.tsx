import prisma from '@/lib/prisma';
import { payReimbursement } from '@/app/actions/admin';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  // Ambil data antrean pencairan (APPROVED) berdasarkan waktu disetujui (FIFO)
  const approvedQueue = await prisma.expense.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approvedAt: 'asc' }, 
    include: { user: true, attachments: true },
  });

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE (DARK MODE) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">🏦</span> Antrean Pencairan Dana
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Daftar laporan yang siap ditransfer berdasarkan prinsip First-In, First-Out (FIFO).
          </p>
        </div>
        <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/20 shadow-sm flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          {approvedQueue.length} Menunggu Cair
        </div>
      </div>

      {/* TABEL ANTREAN FIFO (DARK MODE) */}
      <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 overflow-hidden relative backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
        
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
                <th className="p-4 pl-6 md:pl-8 w-16">No. Urut</th>
                <th className="p-4">Identitas Teknisi</th>
                <th className="p-4">Nominal Cair</th>
                <th className="p-4">Referensi Struk</th>
                <th className="p-4 pr-6 md:pr-8 text-center min-w-[200px]">Aksi Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {approvedQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="text-5xl mb-4 grayscale opacity-20">💸</div>
                    <p className="text-slate-400 font-bold text-lg">Antrean Bersih!</p>
                    <p className="text-slate-500 text-sm mt-1">Tidak ada hutang, semua dana sudah dicairkan.</p>
                  </td>
                </tr>
              ) : (
                approvedQueue.map((item: any, index: number) => {
                  const receipt = item.attachments?.find((a: any) => a.type === 'RECEIPT')?.fileUrl;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/80 transition-colors">
                      <td className="p-4 pl-6 md:pl-8">
                        <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-slate-500">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-white text-sm">{item.user?.name || 'Anonim'}</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5 max-w-[200px] truncate" title={item.description}>
                          {item.description}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-xl font-black text-blue-400 tracking-tight">{formatRupiah(Number(item.amount))}</p>
                      </td>
                      <td className="p-4">
                        {receipt ? (
                          <a href={receipt} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-white text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 w-max">
                            🧾 Buka Struk ↗
                          </a>
                        ) : (
                          <span className="text-xs font-bold text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 md:pr-8">
                        {/* FORM TRANSFER (DARK MODE) */}
                        <form action={payReimbursement} className="w-full">
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-900/50 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                            <span className="group-hover:animate-bounce">💰</span> Tandai Sudah Cair
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}