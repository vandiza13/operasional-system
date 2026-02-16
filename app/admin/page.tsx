// app/admin/page.tsx
import prisma from '@/lib/prisma';
import { approveReimbursement, payReimbursement } from '@/app/actions/admin';

// PERBAIKAN 1: Wajib tambahkan baris ini agar Dashboard Admin selalu real-time (tidak di-cache)
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

  // PERBAIKAN 2: Pastikan tipe datanya adalah 'number' bawaan JavaScript
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0 // Menghilangkan ,00 di belakang jika tidak perlu
    }).format(angka);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan Operasional</h1>
            <p className="text-gray-500">Rekapitulasi dan antrean pencairan dana teknisi.</p>
          </div>
        </div>

        {/* TABEL 1: PERLU VERIFIKASI (PENDING) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-orange-600 mb-4 flex items-center">
            <span className="bg-orange-100 p-1 rounded mr-2">⏳</span> Perlu Verifikasi Bukti
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-3">Teknisi</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada laporan baru.</td></tr>
                ) : (
                  pendingList.map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{item.user?.name || 'User Tidak Diketahui'}</td>
                      <td className="p-3 text-sm text-gray-600">{item.description}</td>
                      {/* PERBAIKAN 3: Konversi Object Prisma Decimal ke Number */}
                      <td className="p-3 font-semibold">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-3">
                        <form action={approveReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
                            Setujui (Masuk Antrean)
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
          <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center">
            <span className="bg-blue-100 p-1 rounded mr-2">🏦</span> Antrean Pencairan Cair (FIFO)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                  <th className="p-3">No. Antrean</th>
                  <th className="p-3">Teknisi</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {approvedQueue.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">Antrean kosong.</td></tr>
                ) : (
                  approvedQueue.map((item: any, index: number) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold text-xl text-blue-600">#{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.user?.name || 'User Tidak Diketahui'}</td>
                      {/* PERBAIKAN 3: Konversi Object Prisma Decimal ke Number */}
                      <td className="p-3 font-semibold text-gray-800">{formatRupiah(Number(item.amount))}</td>
                      <td className="p-3">
                        <form action={payReimbursement}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">
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