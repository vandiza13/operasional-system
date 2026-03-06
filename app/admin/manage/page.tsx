import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

import ManageClaimsTable from '@/app/components/ManageClaimsTable';
import { Suspense } from 'react';

export default async function ManageClaimsPage() {
    const session = await getSession();
    if (!session || !session.userId) {
        redirect('/login');
    }
    const userId = session.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
        redirect('/admin'); // Redirect back to normal admin if not Super Admin
    }

    // Ambil semua data expense, termasuk kategori dan user pembuatnya
    // Kita urutkan berdasarkan yang paling baru (descending)
    const allExpenses = await prisma.expense.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    nik: true,
                    phone: true,
                }
            },
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            approver: {
                select: {
                    name: true
                }
            },
            attachments: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Ambil juga semua daftar kategori aktif untuk modal Edit nanti
    const activeCategories = await prisma.expenseCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // Serialize Decimal amount into string for the Client Component
    const serializedExpenses = allExpenses.map(exp => ({
        ...exp,
        amount: exp.amount.toString(),
    }));

    return (
        <div>
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Kelola Semua Bon</h2>
                        <p className="text-slate-400 mt-1">Area Super Admin untuk mengedit atau menghapus data riwayat secara permanen.</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-6 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                    <Suspense fallback={
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                    }>
                        <ManageClaimsTable expenses={serializedExpenses as any} categories={activeCategories} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
