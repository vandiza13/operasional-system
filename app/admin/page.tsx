import prisma from '@/lib/prisma';
import Link from 'next/link';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // 1. QUERY METRIK AGREGASI & COUNTING
  const [sumPending, sumApproved, sumPaid, countPending, countQueue, countTechs] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'APPROVED' } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.expense.count({ where: { status: 'PENDING' } }),
    prisma.expense.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'TECHNICIAN' } })
  ]);

  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Ringkasan Sistem</h2>
        <p className="text-sm text-slate-400 font-medium mt-1">Pantau arus kas dan beban kerja operasional hari ini.</p>
      </div>

      {/* 3 KARTU RUPIAH UTAMA (DARK MODE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* KARTU PENDING */}
        <div className="bg-slate-800/50 p-6 rounded-3xl shadow-lg border border-amber-500/20 relative overflow-hidden group backdrop-blur-sm">
          <div className="absolute -top-4 -right-4 bg-amber-500/10 w-24 h-24 rounded-full transition-transform group-hover:scale-150 duration-500"></div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="text-xl">⏳</span> Perlu Verifikasi
            </p>
            <p className="text-3xl font-black text-white mt-3">{formatRupiah(Number(sumPending._sum.amount || 0))}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Ada {countPending} laporan baru</p>
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
            <p className="text-xs text-slate-400 font-medium mt-1">Total pengeluaran sukses</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTION CARDS (DARK MODE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        
        <Link href="/admin/approval" className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:border-amber-500/50 hover:bg-slate-800 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📄</div>
          <div>
            <h3 className="font-bold text-white">Cek Bon Baru</h3>
            <p className="text-xs text-slate-400">Verifikasi {countPending} laporan</p>
          </div>
        </Link>

        <Link href="/admin/queue" className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-500/50 hover:bg-slate-800 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">💸</div>
          <div>
            <h3 className="font-bold text-white">Transfer Dana</h3>
            <p className="text-xs text-slate-400">Selesaikan {countQueue} antrean</p>
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