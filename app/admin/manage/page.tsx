import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

import ManageClaimsTable from '@/app/components/ManageClaimsTable';
import MonthFilter from '@/app/admin/MonthFilter'; 
import { Suspense } from 'react';

// WAJIB: Pastikan halaman Admin ini tidak di-cache secara statis 
// agar setiap perubahan data (Edit/Hapus) langsung terlihat.
export const dynamic = 'force-dynamic';

export default async function ManageClaimsPage(props: { searchParams: Promise<{ month?: string }> }) {
    // 1. Validasi Sesi & Role
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
        redirect('/admin'); // Kembalikan ke dashboard normal jika bukan Super Admin
    }

    // 2. Logika Rentang Waktu (Filter Bulan)
    const searchParams = await props.searchParams;
    const monthParam = searchParams?.month;

    const now = new Date();
    // Jika tidak ada parameter di URL, gunakan bulan saat ini
    const targetMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Hitung tanggal 1 dan hari terakhir di bulan tersebut
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 3. Ambil semua data expense yang difilter berdasarkan bulan
    const allExpenses = await prisma.expense.findMany({
        where: {
            // [PERBAIKAN PENTING] Filter menggunakan expenseDate (Tanggal Kejadian Bon Asli)
            expenseDate: {
                gte: startDate,
                lte: endDate,
            }
        },
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
            createdAt: 'desc' // Urutkan berdasarkan yang terakhir kali diinput ke sistem
        }
    });

    // 4. Ambil juga semua daftar kategori aktif untuk modal Edit
    const activeCategories = await prisma.expenseCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // 5. Transformasi Data (Serialization)
    const serializedExpenses = allExpenses.map(exp => ({
        ...exp,
        amount: Number(exp.amount),
    }));

    return (
        <div className="space-y-6">

            {/* HEADER PAGE */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/60 pb-6 relative z-50">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span className="text-3xl">⚙️</span> Kelola Semua Bon
                    </h2>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                        Area khusus Super Admin untuk mengedit atau menghapus data riwayat secara permanen.
                    </p>
                </div>

                {/* Menampilkan Komponen Filter Bulan */}
                <div className="flex flex-col items-end gap-2">
                    <Suspense fallback={<div className="h-11 w-40 bg-slate-800 animate-pulse rounded-xl border border-slate-700"></div>}>
                        <MonthFilter />
                    </Suspense>
                </div>
            </div>

            {/* KONTEN TABEL */}
            {/* z-10 memastikan dropdown filter (z-50) bisa terbuka di atas tabel ini */}
            <div className="bg-slate-800/50 rounded-3xl p-6 shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm z-10">
                {/* Garis Aksen Gradient di atas */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-indigo-600"></div>
                
                <Suspense fallback={
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                }>
                    <ManageClaimsTable 
                        expenses={serializedExpenses as any} 
                        categories={activeCategories} 
                    />
                </Suspense>
            </div>
            
        </div>
    );
}