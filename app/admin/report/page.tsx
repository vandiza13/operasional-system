import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import ReportFilter from './ReportFilter';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';

export default async function ReportPage({
    searchParams,
}: {
    searchParams: Promise<{ startDate?: string; endDate?: string; status?: string }>;
}) {
    const session = await getSession();
    if (!session || !session.userId) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { role: true }
    });

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
        redirect('/');
    }

    const resolvedParams = await searchParams;
    const startDateStr = resolvedParams?.startDate;
    const endDateStr = resolvedParams?.endDate;
    const statusParam = resolvedParams?.status || 'APPROVED';

    // Siapkan Date
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateStr && endDateStr) {
        // Gunakan waktu lokal WIB di awal hari dan akhir hari
        startDate = new Date(`${startDateStr}T00:00:00+07:00`);
        endDate = new Date(`${endDateStr}T23:59:59+07:00`);
    } else {
        // Default to this week (Friday to Thursday)
        const today = new Date();
        const day = today.getDay();
        const diffToLastFriday = day >= 5 ? day - 5 : day + 2;

        // Last friday
        const lastFriday = new Date(today);
        lastFriday.setDate(today.getDate() - diffToLastFriday);

        const nextThursday = new Date(lastFriday);
        nextThursday.setDate(lastFriday.getDate() + 6);

        const sdStr = `${lastFriday.getFullYear()}-${String(lastFriday.getMonth() + 1).padStart(2, '0')}-${String(lastFriday.getDate()).padStart(2, '0')}`;
        const edStr = `${nextThursday.getFullYear()}-${String(nextThursday.getMonth() + 1).padStart(2, '0')}-${String(nextThursday.getDate()).padStart(2, '0')}`;

        redirect(`/admin/report?startDate=${sdStr}&endDate=${edStr}&status=APPROVED`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
        expenseDate: {
            gte: startDate,
            lte: endDate,
        }
    };

    if (statusParam !== 'ALL') {
        whereClause.status = statusParam;
    }

    // Query Database
    const expenses = await prisma.expense.findMany({
        where: whereClause,
        include: {
            user: { select: { name: true, nik: true } },
            category: { select: { name: true } },
        },
        orderBy: { expenseDate: 'asc' }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* HEADER PAGE DENGAN FILTER */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Cetak Laporan</h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                        Filter dan ekspor data pengeluaran berdasarkan siklus tanggal dan status.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <ReportFilter />
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                        <ExportButton startDate={startDateStr} endDate={endDateStr} status={statusParam} />
                    </div>
                </div>
            </div>

            {/* SUMMARY CARD */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Nilai ({statusParam})</p>
                    <p className="text-3xl font-black text-white">{formatRupiah(totalAmount)}</p>
                    <p className="text-sm text-slate-500 mt-1">Dari {expenses.length} transaksi di rentang tanggal ini.</p>
                </div>
                <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Periode</p>
                    <p className="text-lg font-bold text-indigo-300">{startDateStr ? formatDate(startDate as Date) : ''} - {endDateStr ? formatDate(endDate as Date) : ''}</p>
                </div>
            </div>

            {/* DATA PREVIEW TABLE */}
            <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-sm">
                <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <span className="text-indigo-400">📄</span> Preview Data
                    </h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-700">
                        {expenses.length} Baris
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-4 font-bold">Tanggal</th>
                                <th className="px-5 py-4 font-bold">Teknisi</th>
                                <th className="px-5 py-4 font-bold">Kategori</th>
                                <th className="px-5 py-4 font-bold">Keterangan</th>
                                <th className="px-5 py-4 font-bold">Status</th>
                                <th className="px-5 py-4 font-bold text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {expenses.length > 0 ? (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-4 font-medium text-slate-300">
                                            {formatDate(expense.expenseDate)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-white">{expense.user.name}</p>
                                            <p className="text-xs text-slate-500">{expense.user.nik || '-'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300">
                                                {expense.category.name}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-slate-400 max-w-[200px] truncate" title={expense.description || '-'}>
                                                {expense.description || '-'}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {expense.status === 'PAID' && <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">PAID</span>}
                                            {expense.status === 'APPROVED' && <span className="text-blue-400 font-bold text-xs bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">APPROVED</span>}
                                            {expense.status === 'PENDING' && <span className="text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">PENDING</span>}
                                            {expense.status === 'REJECTED' && <span className="text-rose-400 font-bold text-xs bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">REJECTED</span>}
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-white">
                                            {formatRupiah(Number(expense.amount))}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="text-4xl">📭</span>
                                            <p className="font-medium">Tidak ada data di rentang waktu dan status ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
