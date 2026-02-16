import prisma from '@/lib/prisma';
import { approveReimbursement, payReimbursement } from '@/app/actions/admin';
import LogoutButton from '@/app/components/LogoutButton';
import AddTechnicianForm from '@/app/components/AddTechnicianForm';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Ambil data PENDING (Perlu Verifikasi)
  const pendingList = await prisma.reimbursement.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { user: true }, 
  });

  // Ambil data APPROVED (Antrean FIFO Pencairan)
  const approvedQueue = await prisma.reimbursement.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approvedAt: 'asc' }, 
    include: { user: true },
  });

  // Fungsi format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0 
    }).format(angka);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* NAVBAR MODERN */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <span className="text-xl text-white">👨‍💻</span>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Admin<span className="text-indigo-600">Panel</span></h1>
                <p className="text-xs text-slate-500 font-medium">Pusat Kendali Operasional</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* COMPONENT TAMBAH TEKNISI BARU */}
        <div className="max-w-xl">
          <AddTechnicianForm />
        </div>

        {/* TABEL 1: PERLU VERIFIKASI (PENDING) */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">⏳</span> Perlu Verifikasi
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Cek kelengkapan struk sebelum disetujui.</p>
            </div>
            <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-200">
              {pendingList.length} Antrean
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-4 pl-6 md:pl-8">Teknisi</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Bukti Foto</th>
                  <th className="p-4 pr-6 md:pr-8 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingList.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">🎉 Yeay! Tidak ada laporan yang perlu divalidasi.</td></tr>
                ) : (
                  pendingList.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 md:pl-8 font-bold text-slate-800">{item.user?.name || 'Anonim'}</td>
                      <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={item.description}>{item.description}</td>
                      <td className="p-4 font-extrabold text-indigo-600">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {item.receiptUrl && (
                            <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-100">
                              🧾 Struk
                            </a>
                          )}
                          {item.evidence1Url && (
                            <a href={item.evidence1Url} target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors">📸 Ev1</a>
                          )}
                          {item.evidence2Url && (
                            <a href={item.evidence2Url} target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors">📸 Ev2</a>
                          )}
                          {item.evidence3Url && (
                            <a href={item.evidence3Url} target="_blank" rel="noopener noreferrer" className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors">📸 Ev3</a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 md:pr-8">
                        <form action={approveReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                            ✅ Setujui
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL 2: ANTREAN PENCAIRAN (FIFO) */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative mt-8">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">🏦</span> Antrean Pencairan Dana
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Berdasarkan prinsip FIFO (Siapa Cepat Dia Dapat).</p>
            </div>
            <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200">
              {approvedQueue.length} Menunggu Cair
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-4 pl-6 md:pl-8 w-16">No.</th>
                  <th className="p-4">Teknisi</th>
                  <th className="p-4">Nominal Cair</th>
                  <th className="p-4">Struk</th>
                  <th className="p-4 pr-6 md:pr-8 text-center">Aksi Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedQueue.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">Antrean kosong. Semua dana sudah dicairkan! 💸</td></tr>
                ) : (
                  approvedQueue.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 pl-6 md:pl-8 font-black text-2xl text-blue-300">#{index + 1}</td>
                      <td className="p-4 font-bold text-slate-800">{item.user?.name || 'Anonim'}</td>
                      <td className="p-4 font-extrabold text-blue-600 text-lg">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-4">
                         {item.receiptUrl && (
                            <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-sm font-bold underline underline-offset-4 flex items-center gap-1">
                              Lihat Bukti ↗
                            </a>
                          )}
                      </td>
                      <td className="p-4 pr-6 md:pr-8">
                        <form action={payReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                            💰 Tandai Cair
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}