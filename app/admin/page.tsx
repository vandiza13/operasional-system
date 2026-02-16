import prisma from '@/lib/prisma';
import { approveReimbursement, payReimbursement } from '@/app/actions/admin';
import LogoutButton from '@/app/components/LogoutButton';


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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Admin Operasional</h1>
            <p className="text-gray-500 mt-1">Sistem verifikasi dan antrean pencairan dana (FIFO).</p>
          </div>
          <LogoutButton />
        </div>

        {/* TABEL 1: PERLU VERIFIKASI (PENDING) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-orange-600 mb-4 flex items-center">
            <span className="bg-orange-100 p-2 rounded-lg mr-3">⏳</span> Perlu Verifikasi Bukti
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-3 w-1/6">Teknisi</th>
                  <th className="p-3 w-1/4">Keterangan</th>
                  <th className="p-3 w-1/6">Nominal</th>
                  <th className="p-3 w-1/4">Bukti Foto</th>
                  <th className="p-3 w-1/6">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Tidak ada laporan baru yang perlu divalidasi.</td></tr>
                ) : (
                  pendingList.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-orange-50 transition-colors">
                      <td className="p-3 font-medium text-gray-800">{item.user?.name || 'Anonim'}</td>
                      <td className="p-3 text-sm text-gray-600">{item.description}</td>
                      <td className="p-3 font-bold text-gray-800">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {/* TOMBOL LIHAT STRUK WAJIB */}
                          {item.receiptUrl && (
                            <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs font-semibold flex items-center transition-colors">
                              🧾 Struk
                            </a>
                          )}
                          {/* TOMBOL LIHAT EVIDEN OPSIONAL */}
                          {item.evidence1Url && (
                            <a href={item.evidence1Url} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center transition-colors">
                              📸 Ev1
                            </a>
                          )}
                          {item.evidence2Url && (
                            <a href={item.evidence2Url} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center transition-colors">
                              📸 Ev2
                            </a>
                          )}
                          {item.evidence3Url && (
                            <a href={item.evidence3Url} target="_blank" rel="noopener noreferrer" className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-xs flex items-center transition-colors">
                              📸 Ev3
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <form action={approveReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 w-full">
                            Setujui (Antrekan)
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-blue-500">
          <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
            <span className="bg-blue-100 p-2 rounded-lg mr-3">🏦</span> Antrean Pencairan Dana (FIFO)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-3 w-16">No.</th>
                  <th className="p-3 w-1/5">Teknisi</th>
                  <th className="p-3 w-1/4">Nominal</th>
                  <th className="p-3 w-1/4">Bukti Laporan</th>
                  <th className="p-3 w-1/5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {approvedQueue.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Antrean kosong. Semua sudah dibayar!</td></tr>
                ) : (
                  approvedQueue.map((item: any, index: number) => (
                    <tr key={item.id} className="border-b hover:bg-blue-50 transition-colors">
                      <td className="p-3 font-black text-2xl text-blue-600">#{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.user?.name || 'Anonim'}</td>
                      <td className="p-3 font-bold text-gray-800">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-3">
                        {/* Menampilkan tombol Struk Utama saja di antrean akhir agar rapi */}
                         {item.receiptUrl && (
                            <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm underline font-medium">
                              Lihat Struk
                            </a>
                          )}
                      </td>
                      <td className="p-3">
                        <form action={payReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 w-full">
                            Tandai Sudah Cair
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

      </div>
    </div>
  );
}