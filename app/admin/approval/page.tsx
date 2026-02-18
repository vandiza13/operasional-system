import prisma from '@/lib/prisma';
import { approveReimbursement, rejectReimbursement } from '@/app/actions/admin';
import { revalidatePath } from 'next/cache';
import ApprovalTable from '@/app/components/ApprovalTable';
import Pagination from '@/app/components/Pagination'; // [BARU] Import Pagination

// WAJIB: Agar Next.js selalu menarik data terbaru
export const dynamic = 'force-dynamic';

export default async function ApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>; // Tangkap parameter page dari URL
}) {
  // 1. KONFIGURASI PAGINATION
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams?.page) || 1;
  const limit = 10; // Jumlah data per halaman
  const skip = (currentPage - 1) * limit;

  // 2. AMBIL DATA & TOTAL COUNT SECARA PARALEL (Efisien)
  const [rawPendingList, totalCount] = await Promise.all([
    prisma.expense.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }, // Urutkan yang lama dulu (FIFO)
      include: { user: true, attachments: true },
      take: limit, // Ambil cuma 10
      skip: skip,  // Lewati data halaman sebelumnya
    }),
    prisma.expense.count({ where: { status: 'PENDING' } }) // Hitung total pending
  ]);

  // Hitung total halaman
  const totalPages = Math.ceil(totalCount / limit);

  // 3. SERIALISASI (Konversi Decimal ke Number)
  const pendingList = rawPendingList.map((item) => ({
    ...item,
    amount: item.amount.toNumber(),
  }));

  // Server Actions Wrappers
  async function handleApprove(formData: FormData) {
    'use server'
    await approveReimbursement(formData);
    revalidatePath('/admin/approval');
  }

  async function handleReject(formData: FormData) {
    'use server'
    await rejectReimbursement(formData);
    revalidatePath('/admin/approval');
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">⏳</span> Verifikasi Laporan
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Cek foto struk dan sesuaikan nominal sebelum menyetujui.
          </p>
        </div>
        <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/20 shadow-sm flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          {totalCount} Menunggu {/* Tampilkan Total Asli, bukan cuma yg di halaman ini */}
        </div>
      </div>

      {/* TABEL DATA */}
      <ApprovalTable 
        expenses={pendingList}
        approveAction={handleApprove}
        rejectAction={handleReject}
      />

      {/* KONTROL PAGINATION [BARU] */}
      <Pagination totalPages={totalPages} />
      
    </div>
  );
}