'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getVerifiedSession } from '@/lib/session';
import { del } from '@vercel/blob';

/**
 * Validasi Role Super Admin
 */
async function verifySuperAdmin() {
    try {
        const session = await getVerifiedSession();
        if (!session || session.userRole !== 'SUPER_ADMIN') return null;

        return { id: session.userId, role: session.userRole };
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

        // [UBAH] 1. Ambil data expense beserta daftar URL attachment-nya
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId },
            include: { attachments: true } // Wajib di-include agar URL file terbaca
        });

        if (!expense) {
            return { success: false, message: 'Data klaim tidak ditemukan.' };
        }

        // 2. Hapus data dari Database (Record Expense & ExpenseAttachment hilang)
        await prisma.expense.delete({
            where: { id: expenseId }
        });

        // 3. [BARU] Bersihkan file fisik di Vercel Blob
        if (expense.attachments && expense.attachments.length > 0) {
            // Saring hanya URL yang di-hosting di Vercel Blob
            const blobUrlsToDelete = expense.attachments
                .map(att => att.fileUrl)
                .filter(url => url.includes('blob.vercel-storage.com'));

            // Jika ada file yang perlu dihapus, eksekusi penghapusan massal
            if (blobUrlsToDelete.length > 0) {
                try {
                    await del(blobUrlsToDelete);
                    console.log('âœ… Berhasil menyapu bersih file sampah dari Vercel Blob:', blobUrlsToDelete.length, 'file');
                } catch (blobErr) {
                    console.error('âš ï¸ Peringatan: Gagal menghapus file dari Vercel Blob (mungkin sudah terhapus):', blobErr);
                    // Kita tidak me-return error ke user karena data di DB sudah berhasil dihapus
                }
            }
        }

        revalidatePath('/admin');
        revalidatePath('/admin/manage');
        revalidatePath('/admin/approval');
        revalidatePath('/admin/queue');

        return { success: true, message: 'Data klaim dan file bukti berhasil dihapus permanen.' };
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

        const oldExpense = await prisma.expense.findUnique({ where: { id } });
        if (!oldExpense) {
            return { success: false, message: 'Data tidak ditemukan.' };
        }

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

        await prisma.$transaction(async (tx) => {
            // [KOREKSI SALDO OTOMATIS]
            // Jika bon yang tadinya SUDAH CAIR (PAID) dikembalikan ke status lain (misal APPROVED/PENDING)
            if (oldExpense.status === 'PAID' && updateData.status && updateData.status !== 'PAID') {
                if (oldExpense.payoutBatchId) {
                    // 1. Kunci dan ambil saldo terakhir
                    const lastLedgers = await tx.$queryRaw<{balance: any}[]>`SELECT balance FROM OperationalLedger ORDER BY createdAt DESC LIMIT 1 FOR UPDATE`;
                    const currentBalance = lastLedgers.length > 0 ? Number(lastLedgers[0].balance) : 0;
                    const refundAmount = Number(oldExpense.amount);
                    const newBalance = currentBalance + refundAmount;
            
                    // 2. Tambah saldo (Refund)
                    await tx.operationalLedger.create({
                        data: {
                            type: 'TOP_UP',
                            amount: refundAmount,
                            balance: newBalance,
                            description: `Pengembalian dana (Refund) akibat pembatalan bon cair`,
                            createdBy: admin.id
                        }
                    });
            
                    // 3. Kurangi nominal di batch pencairan yang lama
                    const batch = await tx.payoutBatch.findUnique({ where: { id: oldExpense.payoutBatchId } });
                    if (batch) {
                        await tx.payoutBatch.update({
                            where: { id: oldExpense.payoutBatchId },
                            data: {
                                totalAmount: Number(batch.totalAmount) - refundAmount
                            }
                        });
                    }
                    
                    // 4. Putuskan hubungan bon dengan batch lama
                    updateData.payoutBatchId = null;
                }
            }

            // Eksekusi pembaruan data bon
            await tx.expense.update({
                where: { id },
                data: updateData
            });
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
