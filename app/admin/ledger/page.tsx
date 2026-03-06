import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

import ManageLedgerTable from '@/app/components/ManageLedgerTable';
import { Suspense } from 'react';

export default async function ManageLedgerPage() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
    });

    // Validasi esktra ketat (Cuma Super Admin yang punya kuasa akses mutasi ledger)
    if (!user || user.role !== 'SUPER_ADMIN') {
        redirect('/admin');
    }

    // Ambil semua histori saldo, dari yang terbaru di atas turun ke riwayat lama
    const ledgerHistory = await prisma.operationalLedger.findMany({
        include: {
            admin: {
                select: { name: true }
            },
            payoutBatch: {
                select: { id: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Ekstrak sisa saldo actual (diperoleh dari angka 'balance' record paling puncak/terbaru)
    const currentActualBalance = ledgerHistory.length > 0 ? Number(ledgerHistory[0].balance) : 0;

    // Serialize Decimal amounts into strings for passing down to the Client Component
    const serializedLedgers = ledgerHistory.map(entry => ({
        ...entry,
        amount: entry.amount.toString(),
        balance: entry.balance.toString()
    }));

    return (
        <div>
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Manajemen Saldo Kas</h2>
                        <p className="text-slate-400 mt-1">
                            Laman wewenang Super Admin untuk menyuntikkan dana kas (Top-Up) & mengaudit histori mutasi keluar/masuk.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/30 p-4 rounded-2xl md:min-w-[280px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/80 mb-1">Total Saldo Kas Tersedia</p>
                        <p className="text-2xl font-black text-white mix-blend-plus-lighter">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentActualBalance)}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-6 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                    <Suspense fallback={
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    }>
                        <ManageLedgerTable ledgers={serializedLedgers as any} currentBalance={currentActualBalance} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
