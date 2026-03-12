'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

/**
 * Validasi Role Super Admin
 */
async function verifySuperAdmin() {
    try {
        const session = await getSession();
        if (!session || !session.userId) return null;
        const userId = session.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });

        if (!user || user.role !== 'SUPER_ADMIN') {
            return null;
        }

        return user;
    } catch (error) {
        return null;
    }
}

/**
 * Hapus Expense secara permanen (hanya untuk SUPER_ADMIN)
 */
export async function deleteExpensePermanent(expenseId: string) {
    try {
        const admin = await verifySuperAdmin();
        if (!admin) {
            return { success: false, message: 'Akses ditolak. Hanya Super Admin yang diizinkan.' };
        }

        if (!expenseId) {
            return { success: false, message: 'ID Klaim tidak valid.' };
        }

        const expense = await prisma.expense.findUnique({
            where: { id: expenseId }
        });

        if (!expense) {
            return { success: false, message: 'Data klaim tidak ditemukan.' };
        }

        // Prisma OnDelete Cascade pada ExpenseAttachment sudah dikonfigurasi di schema, 
        // jadi menghapus expense akan otomatis menghapus attachment records dari DB.
        // (File fisik di Vercel Blob masih ada, tapi record di DB bersih)

        await prisma.expense.delete({
            where: { id: expenseId }
        });

        revalidatePath('/admin');
        revalidatePath('/admin/manage');
        revalidatePath('/admin/approval');
        revalidatePath('/admin/queue');

        return { success: true, message: 'Data klaim berhasil dihapus permanen.' };
    } catch (error) {
        console.error('Error deleting expense:', error);
        return { success: false, message: 'Terjadi kesalahan sistem saat menghapus data.' };
    }
}

/**
 * Update Data Expense (hanya untuk SUPER_ADMIN)
 */
export async function updateExpenseRecord(formData: FormData) {
    try {
        const admin = await verifySuperAdmin();
        if (!admin) {
            return { success: false, message: 'Akses ditolak. Hanya Super Admin yang diizinkan.' };
        }

        const id = formData.get('id') as string;
        const categoryId = formData.get('categoryId') as string;
        const description = formData.get('description') as string;
        const amountStr = formData.get('amount') as string;
        const kmBeforeStr = formData.get('kmBefore') as string;
        const kmAfterStr = formData.get('kmAfter') as string;
        const status = formData.get('status') as string;
        
        // [BARU] Menangkap data Nopol Kendaraan dari form edit Admin
        const vehiclePlate = formData.get('vehiclePlate') as string | null;

        if (!id || !amountStr) {
            return { success: false, message: 'Data tidak lengkap.' };
        }

        const updateData: any = {
            amount: parseFloat(amountStr),
            description: description,
        };

        if (categoryId) updateData.categoryId = categoryId;

        // Status update
        if (status && ['PENDING', 'APPROVED', 'PAID', 'REJECTED'].includes(status)) {
            updateData.status = status;
        }

        // KM Update
        if (kmBeforeStr) {
            updateData.kmBefore = parseInt(kmBeforeStr, 10);
        } else {
            updateData.kmBefore = null; // allow clearing
        }

        if (kmAfterStr) {
            updateData.kmAfter = parseInt(kmAfterStr, 10);
        } else {
            updateData.kmAfter = null; // allow clearing
        }

        // [BARU] Menyimpan data Plat Nomor ke Database
        if (vehiclePlate !== null) {
            // Jika kosong/dihapus, set ke null. Jika ada isi, jadikan huruf besar (Uppercase)
            updateData.vehiclePlate = vehiclePlate.trim() === '' ? null : vehiclePlate.trim().toUpperCase();
        }

        await prisma.expense.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin');
        revalidatePath('/admin/manage');
        revalidatePath('/admin/approval');
        revalidatePath('/admin/queue');

        return { success: true, message: 'Data klaim berhasil diperbarui.' };

    } catch (error) {
        console.error('Error updating expense:', error);
        return { success: false, message: 'Terjadi kesalahan sistem saat memperbarui data.' };
    }
}