import prisma from '@/lib/prisma';
import { getCurrentBalance } from '@/app/actions/admin';
import QueueListClient from './QueueListClient'; 

export const dynamic = 'force-dynamic';

export default async function QueuePage() {
  // 1. Ambil data bon
  const approvedQueue = await prisma.expense.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approvedAt: 'asc' },
    include: { user: true, attachments: true },
  });

  // 2. Ambil Informasi Saldo
  const currentBalance = await getCurrentBalance();

  // 3. Konsolidasi Bon per Teknisi & SERIALISASI DATA
  const groupedPayouts = approvedQueue.reduce((acc, curr) => {
    const techId = curr.userId;
    if (!acc[techId]) {
      acc[techId] = {
        technicianId: techId,
        technicianName: curr.user?.name || 'Anonim',
        technicianNik: curr.user?.nik || '-',
        technicianPhone: curr.user?.phone || '-',
        totalAmount: 0,
        expenses: [] 
      };
    }
    
    acc[techId].totalAmount += Number(curr.amount);

    // [PERBAIKAN] Serialisasi (Ubah tipe Decimal Prisma menjadi Number biasa agar Next.js tidak error)
    const serializedExpense = {
        ...curr,
        amount: Number(curr.amount)
    };

    acc[techId].expenses.push(serializedExpense);
    return acc;
  }, {} as Record<string, { technicianId: string, technicianName: string, technicianNik: string, technicianPhone: string, totalAmount: number, expenses: any[] }>);

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
            Pilih dan cairkan bon sesuai ketersediaan kas. Fitur centang otomatis menyesuaikan total bayar.
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

      {/* TABEL ANTREAN KONSOLIDASI (DITANGANI OLEH CLIENT COMPONENT) */}
      <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 overflow-hidden relative backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
        
        {/* Serahkan urusan rendering tabel & checkbox ke komponen List */}
        <QueueListClient payoutsArray={payoutsArray} currentBalance={currentBalance} />
        
      </div>
    </div>
  );
}