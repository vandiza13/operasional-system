import prisma from '@/lib/prisma';
import { getCurrentBalance } from '@/app/actions/admin';
import PayoutForm from './PayoutForm';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  // 1. Ambil data bon (HANYA YANG APPROVED, SEMUA BULAN)
  const approvedQueue = await prisma.expense.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approvedAt: 'asc' }, 
    include: { user: true, attachments: true },
  });

  // 2. Ambil Informasi Saldo Operasional Saat Ini
  const currentBalance = await getCurrentBalance();

  // 3. LOGIKA KONSOLIDASI: Kelompokkan Bon berdasarkan Teknisi
  const groupedPayouts = approvedQueue.reduce((acc, curr) => {
    const techId = curr.userId;
    if (!acc[techId]) {
      acc[techId] = {
        technicianId: techId,
        technicianName: curr.user?.name || 'Anonim',
        totalAmount: 0,
        expenses: [] // Menyimpan rincian bon untuk akordion
      };
    }
    acc[techId].totalAmount += Number(curr.amount);
    acc[techId].expenses.push(curr);
    return acc;
  }, {} as Record<string, { technicianId: string, technicianName: string, totalAmount: number, expenses: any[] }>);

  // Ubah objek hasil group menjadi array agar bisa di-map di HTML
  const payoutsArray = Object.values(groupedPayouts);

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">🏦</span> Antrean Pencairan Dana
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Konsolidasi otomatis. Satu kali klik untuk melunasi semua bon milik teknisi.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {/* INDIKATOR SALDO KAS */}
          <div className="bg-slate-800/80 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 shadow-sm flex items-center gap-2">
            Saldo Kas Operasional: 
            <span className={currentBalance > 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatRupiah(currentBalance)}
            </span>
          </div>

          <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/20 shadow-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            {payoutsArray.length} Antrean Teknisi
          </div>
        </div>
      </div>

      {/* TABEL ANTREAN KONSOLIDASI */}
      <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 overflow-hidden relative backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
        
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
                <th className="p-4 pl-6 md:pl-8 w-16">No</th>
                <th className="p-4">Identitas Teknisi</th>
                <th className="p-4">Rincian Bon</th>
                <th className="p-4">Total Konsolidasi</th>
                <th className="p-4 pr-6 md:pr-8 text-center min-w-[200px]">Aksi Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {payoutsArray.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="text-5xl mb-4 grayscale opacity-20">💸</div>
                    <p className="text-slate-400 font-bold text-lg">Antrean Bersih!</p>
                    <p className="text-slate-500 text-sm mt-1">Tidak ada hutang, semua dana sudah dicairkan.</p>
                  </td>
                </tr>
              ) : (
                payoutsArray.map((item, index) => {
                  const isBalanceSufficient = currentBalance >= item.totalAmount;

                  return (
                    <tr key={item.technicianId} className="hover:bg-slate-800/80 transition-colors">
                      <td className="p-4 pl-6 md:pl-8">
                        <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-slate-500">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-white text-base">{item.technicianName}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Menunggu <span className="text-blue-400 font-bold">{item.expenses.length} Bon</span> dicairkan
                        </p>
                      </td>
                      <td className="p-4 min-w-[250px] whitespace-normal">
                        {/* AKORDION UNTUK RINCIAN BON */}
                        <details className="group cursor-pointer">
                          <summary className="text-indigo-400 hover:text-indigo-300 font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-lg w-max transition-colors outline-none list-none flex items-center gap-2">
                            Lihat Rincian <span>⬇</span>
                          </summary>
                          <ul className="mt-3 space-y-2 text-[11px] text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 shadow-inner">
                            {item.expenses.map((e: any) => (
                              <li key={e.id} className="flex justify-between items-center gap-4 border-b border-slate-800/60 pb-1.5 last:border-0 last:pb-0">
                                <span className="truncate max-w-[150px] font-medium" title={e.description}>
                                  {e.description || 'Tanpa Keterangan'}
                                </span>
                                <span className="font-bold text-slate-400">{formatRupiah(Number(e.amount))}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="p-4">
                        <p className="text-xl font-black text-blue-400 tracking-tight">{formatRupiah(item.totalAmount)}</p>
                      </td>
                      <td className="p-4 pr-6 md:pr-8">
                        {/* TOMBOL PENCAIRAN (CLIENT COMPONENT) */}
                        <PayoutForm 
                          technicianId={item.technicianId} 
                          formattedAmount={formatRupiah(item.totalAmount)}
                          isDisabled={!isBalanceSufficient}
                        />
                        
                        {/* PESAN ERROR JIKA SALDO KURANG */}
                        {!isBalanceSufficient && (
                          <p className="text-[10px] text-red-400 font-bold mt-2 text-center animate-pulse">
                            ⚠️ Saldo Kas Tidak Cukup!
                          </p>
                        )}
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