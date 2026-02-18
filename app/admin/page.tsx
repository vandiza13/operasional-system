import prisma from '@/lib/prisma';
import Link from 'next/link';
import TopUpModal from './TopUpModal';
import MonthFilter from './MonthFilter';
import ExportButton from './ExportButton';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>; // Next.js 15 Async Params
}) {

  // 1. TENTUKAN RENTANG TANGGAL (START & END DATE) BERDASARKAN FILTER
  const resolvedParams = await searchParams;
  const monthParam = resolvedParams?.month;
  
  // 🔥 Dapatkan Waktu Server Saat Ini secara Spesifik di WIB
  const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
  const currentDateWIB = new Date(nowStr);

  // Jika ada parameter bulan, gunakan itu. Jika tidak, gunakan bulan WIB saat ini.
  const year = monthParam ? parseInt(monthParam.split('-')[0]) : currentDateWIB.getFullYear();
  const monthIndex = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : currentDateWIB.getMonth();

  // 🔥 KUNCI ZONA WAKTU WIB (UTC+7) SECARA ABSOLUT
  const startDate = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23 - 7, 59, 59, 999));

  // Filter Prisma
  const dateFilter = {
    expenseDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  // 2. QUERY METRIK (DIFILTER BERDASARKAN BULAN) & SALDO KAS (ALL TIME)
  const [
    sumPending, sumApproved, sumPaid, 
    countPending, countQueue, countTechs,
    lastLedger 
  ] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'PENDING', ...dateFilter } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED', ...dateFilter } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'PAID', ...dateFilter } }),
    prisma.expense.count({ where: { status: 'PENDING', ...dateFilter } }),
    prisma.expense.count({ where: { status: 'APPROVED', ...dateFilter } }),
    // Jumlah Teknisi dan Saldo Buku Kas TIDAK BOLEH difilter bulan
    prisma.user.count({ where: { role: 'TECHNICIAN' } }),
    prisma.operationalLedger.findFirst({ orderBy: { createdAt: 'desc' } })
  ]);

  const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  // Nama bulan untuk ditampilkan di UI
  const monthName = startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE DENGAN FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Ringkasan Sistem</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Data statistik laporan untuk periode <span className="text-white font-bold">{monthName}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <MonthFilter />
          <ExportButton />
          <TopUpModal />
        </div>
      </div>

      {/* KARTU SALDO OPERASIONAL (HERO CARD) - TIDAK TERPENGARUH FILTER BULAN */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="text-xl">💰</span> Saldo Operasional Saat Ini
            </p>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {formatRupiah(currentBalance)}
            </p>
          </div>
          
          <div className="bg-slate-950/40 px-5 py-3 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status Keuangan</p>
            {currentBalance >= Number(sumApproved._sum.amount || 0) ? (
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span>✅</span> Aman untuk Antrean ({monthName})
              </p>
            ) : (
              <p className="text-sm font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
                <span>⚠️</span> Kurang untuk Antrean ({monthName})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3 KARTU RUPIAH UTAMA (DARK MODE) - DIFILTER BERDASARKAN BULAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KARTU PENDING */}
        <div className="bg-slate-800/50 p-6 rounded-3xl shadow-lg border border-amber-500/20 relative overflow-hidden group backdrop-blur-sm">
          <div className="absolute -top-4 -right-4 bg-amber-500/10 w-24 h-24 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-xl">⏳</span> Perlu Verifikasi
            </p>
            <p className="text-3xl font-black text-white mt-3">{formatRupiah(Number(sumPending._sum.amount || 0))}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Ada {countPending} laporan baru di bulan ini</p>
          </div>
        </div>
        
        {/* KARTU ANTREAN (APPROVED) */}
        <div className="bg-slate-800/50 p-6 rounded-3xl shadow-lg border border-blue-500/20 relative overflow-hidden group backdrop-blur-sm">
          <div className="absolute -top-4 -right-4 bg-blue-500/10 w-24 h-24 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-xl">🏦</span> Menunggu Cair
            </p>
            <p className="text-3xl font-black text-white mt-3">{formatRupiah(Number(sumApproved._sum.amount || 0))}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">{countQueue} antrean belum ditransfer</p>
          </div>
        </div>

        {/* KARTU CAIR (PAID) */}
        <div className="bg-slate-800/50 p-6 rounded-3xl shadow-lg border border-emerald-500/20 relative overflow-hidden group backdrop-blur-sm">
          <div className="absolute -top-4 -right-4 bg-emerald-500/10 w-24 h-24 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-xl">✅</span> Total Dicairkan
            </p>
            <p className="text-3xl font-black text-white mt-3">{formatRupiah(Number(sumPaid._sum.amount || 0))}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Pengeluaran sukses di bulan ini</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        <Link href="/admin/approval" className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:border-amber-500/50 hover:bg-slate-800 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📄</div>
          <div>
            <h3 className="font-bold text-white">Cek Bon Baru</h3>
            <p className="text-xs text-slate-400">Verifikasi seluruh laporan pending</p>
          </div>
        </Link>

        <Link href="/admin/queue" className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-500/50 hover:bg-slate-800 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💸</div>
          <div>
            <h3 className="font-bold text-white">Transfer Dana</h3>
            <p className="text-xs text-slate-400">Selesaikan seluruh antrean transfer</p>
          </div>
        </Link>

        <Link href="/admin/technicians" className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:border-purple-500/50 hover:bg-slate-800 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">👥</div>
          <div>
            <h3 className="font-bold text-white">Kelola Teknisi</h3>
            <p className="text-xs text-slate-400">Saat ini ada {countTechs} staf aktif</p>
          </div>
        </Link>
      </div>

    </div>
  );
}