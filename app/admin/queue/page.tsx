import prisma from '@/lib/prisma';
import { getCurrentBalance } from '@/app/actions/admin';
import PayoutForm from './PayoutForm';
import QueueEvidenceViewer from './QueueEvidenceViewer';

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
        technicianNik: curr.user?.nik || '-',
        technicianPhone: curr.user?.phone || '-',
        totalAmount: 0,
        expenses: [] // Menyimpan rincian bon untuk akordion
      };
    }
    acc[techId].totalAmount += Number(curr.amount);
    acc[techId].expenses.push(curr);
    return acc;
  }, {} as Record<string, { technicianId: string, technicianName: string, technicianNik: string, technicianPhone: string, totalAmount: number, expenses: any[] }>);

  // Ubah objek hasil group menjadi array agar bisa di-map di HTML
  const payoutsArray = Object.values(groupedPayouts);

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  const formatDate = (date: Date | string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

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

        {/* DESKTOP VIEW: TABEL KONSOLIDASI */}
        <div className="overflow-x-auto p-2 hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
                <th className="p-4 pl-8 w-16">No</th>
                <th className="p-4">Identitas Teknisi</th>
                <th className="p-4">Rincian Bon</th>
                <th className="p-4">Total Konsolidasi</th>
                <th className="p-4 pr-8 text-center min-w-[200px]">Aksi Transfer</th>
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
                      <td className="p-4 pl-8">
                        <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-slate-500">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-white text-base">{item.technicianName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1 flex-wrap">
                          NIK: {item.technicianNik} •
                          {item.technicianPhone && item.technicianPhone !== '-' ? (
                            <a
                              href={`https://wa.me/${item.technicianPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                              title="Chat via WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.263 1.996.763 2.864l-1.041 3.841 3.916-1.033c.84.456 1.785.698 2.744.701h.004c3.18 0 5.766-2.585 5.768-5.766-.002-3.18-2.588-5.766-5.766-5.766l-.02-.007zm3.328 8.169c-.183.52-.942 1.011-1.328 1.127-.336.1-.735.15-2.071-.412-1.748-.733-2.912-2.316-2.992-2.428-.08-.112-.705-.968-.705-1.85 0-.882.441-1.314.593-1.482.152-.168.336-.211.448-.211.112 0 .224 0 .32.005.105.006.248-.04.384.295.144.352.488 1.226.528 1.315.04.089.064.192.008.305-.056.113-.088.185-.168.281-.08.096-.168.216-.24.296-.08.089-.168.185-.064.361.104.177.464.78.992 1.25.688.608 1.256.793 1.432.889.176.095.28.08.384-.04.104-.12.448-.52.568-.705.12-.176.24-.144.4-.08.16.056 1.008.48 1.184.568.168.088.28.144.32.224.04.08.04.464-.144.984z" /></svg>
                              <span className="group-hover:underline">{item.technicianPhone}</span>
                            </a>
                          ) : 'WA: -'}
                        </p>
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
                              <li key={e.id} className="flex justify-between items-center gap-4 border-b border-slate-800/60 pb-2 last:border-0 last:pb-0">
                                <div className="flex flex-col max-w-[200px]">
                                  <span className="truncate font-medium text-white" title={e.description}>
                                    {e.description || 'Tanpa Keterangan'}
                                  </span>
                                  {e.vehiclePlate && (
                                    <span className="text-[9px] font-black text-indigo-400 mt-0.5 uppercase tracking-wider">
                                      🚗 {e.vehiclePlate}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] text-slate-500">{formatDate(e.expenseDate)}</span>
                                    {/* COMPONENT VIEWER BUKTI */}
                                    <QueueEvidenceViewer attachments={e.attachments} />
                                  </div>
                                </div>
                                <span className="font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700/50">
                                  {formatRupiah(Number(e.amount))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="p-4">
                        <p className="text-xl font-black text-blue-400 tracking-tight">{formatRupiah(item.totalAmount)}</p>
                      </td>
                      <td className="p-4 pr-8">
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

        {/* MOBILE VIEW: KARTU KONSOLIDASI */}
        <div className="md:hidden flex flex-col gap-4 p-4 mt-2">
          {payoutsArray.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800">
              <div className="text-5xl mb-4 grayscale opacity-20">💸</div>
              <p className="text-slate-400 font-bold text-lg">Antrean Bersih!</p>
              <p className="text-slate-500 text-sm mt-1">Tidak ada hutang, semua dana sukses dicairkan.</p>
            </div>
          ) : (
            payoutsArray.map((item, index) => {
              const isBalanceSufficient = currentBalance >= item.totalAmount;

              return (
                <div key={item.technicianId} className="bg-slate-900/80 rounded-2xl border border-slate-700/80 shadow-lg flex flex-col overflow-hidden relative">
                  {/* Status Banner */}
                  <div className="bg-slate-950 px-5 py-3 border-b border-slate-700/50 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Antrean #{index + 1}
                    </span>
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                      {item.expenses.length} Bon Tergabung
                    </span>
                  </div>

                  {/* Technician Info */}
                  <div className="p-5 flex flex-col gap-1 border-b border-slate-800/60">
                    <h3 className="font-extrabold text-white text-lg">{item.technicianName}</h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 flex-wrap">
                      NIK: {item.technicianNik} •
                      {item.technicianPhone && item.technicianPhone !== '-' ? (
                        <a
                          href={`https://wa.me/${item.technicianPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766 0 1.011.263 1.996.763 2.864l-1.041 3.841 3.916-1.033c.84.456 1.785.698 2.744.701h.004c3.18 0 5.766-2.585 5.768-5.766-.002-3.18-2.588-5.766-5.766-5.766l-.02-.007zm3.328 8.169c-.183.52-.942 1.011-1.328 1.127-.336.1-.735.15-2.071-.412-1.748-.733-2.912-2.316-2.992-2.428-.08-.112-.705-.968-.705-1.85 0-.882.441-1.314.593-1.482.152-.168.336-.211.448-.211.112 0 .224 0 .32.005.105.006.248-.04.384.295.144.352.488 1.226.528 1.315.04.089.064.192.008.305-.056.113-.088.185-.168.281-.08.096-.168.216-.24.296-.08.089-.168.185-.064.361.104.177.464.78.992 1.25.688.608 1.256.793 1.432.889.176.095.28.08.384-.04.104-.12.448-.52.568-.705.12-.176.24-.144.4-.08.16.056 1.008.48 1.184.568.168.088.28.144.32.224.04.08.04.464-.144.984z" /></svg>
                          <span className="group-hover:underline">{item.technicianPhone}</span>
                        </a>
                      ) : 'WA: -'}
                    </p>
                  </div>

                  {/* Accordion Rincian */}
                  <div className="p-5 bg-slate-900/40 border-b border-slate-800/60">
                    <details className="group cursor-pointer">
                      <summary className="text-indigo-400 hover:text-indigo-300 font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl w-full flex items-center justify-between transition-colors outline-none list-none shadow-sm">
                        Lihat Rincian Bon
                        <span className="text-lg group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <ul className="mt-3 space-y-2 text-[11px] text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-inner">
                        {item.expenses.map((e: any) => (
                          <li key={e.id} className="flex justify-between items-start gap-3 border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                            <div className="flex flex-col flex-1 pt-0.5">
                              <span className="font-medium leading-relaxed text-white">
                                {e.description || 'Tidak ada deskripsi pekerjaan'}
                              </span>
                              {e.vehiclePlate && (
                                <span className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-wider">
                                  🚗 Plat: {e.vehiclePlate}
                                </span>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[9px] text-slate-500 font-semibold">{formatDate(e.expenseDate)}</span>
                                {/* COMPONENT VIEWER BUKTI */}
                                <QueueEvidenceViewer attachments={e.attachments} />
                              </div>
                            </div>
                            <span className="font-bold text-slate-300 whitespace-nowrap bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700/50 shadow-sm mt-0.5">
                              {formatRupiah(Number(e.amount))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>

                  {/* Saldo & Tombol Transfer */}
                  <div className="p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-slate-800 border-dashed pb-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Konsolidasi</p>
                      <p className="text-2xl font-black text-blue-400 tracking-tight">{formatRupiah(item.totalAmount)}</p>
                    </div>

                    <div>
                      <PayoutForm
                        technicianId={item.technicianId}
                        formattedAmount={formatRupiah(item.totalAmount)}
                        isDisabled={!isBalanceSufficient}
                      />
                      {!isBalanceSufficient && (
                        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2">
                          <span className="animate-pulse">⚠️</span>
                          <span className="text-[10px] font-bold text-red-400">Saldo Kas Tidak Mencukupi</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}