'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getVerifiedSession } from '@/lib/session';

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
 * Menghitung ulang seluruh field `balance` dari awal sampai akhir.
 * [DEPRECATED / BACKUP ONLY] Sekarang digantikan oleh Delta Update O(1) yang super cepat dan hemat memori.
 */
export async function recalculateBalances() {
    try {
        // 1. Ambil seluruh catatan ledger urut berdasar tanggal terlama (asc)
        const allLedgers = await prisma.operationalLedger.findMany({
            orderBy: { createdAt: 'asc' }
        });

        if (allLedgers.length === 0) return true;

        // Hitung berantai secara lokal
        let runningBalance = 0;

        // Batch updates
        const updatePromises = allLedgers.map((ledger) => {
            const amount = Number(ledger.amount);

            if (ledger.type === 'TOP_UP') {
                runningBalance += amount; // Saldo masuk/tambah
            } else {
                runningBalance -= amount; // Saldo keluar/tarik (Kredit)
            }

            return prisma.operationalLedger.update({
                where: { id: ledger.id },
                data: { balance: runningBalance }
            });
        });

        // Jalankan seluruh pembaruan saldo melalui satu transaksi massal aman
        await prisma.$transaction(updatePromises);
        return true;

    } catch (err) {
        console.error("Gagal melakukan rekalkulasi berantai:", err);
        return false;
    }
}

/**
 * Super Admin Menambahkan Top-Up Saldo Tunai Manual
 */
export async function addLedgerEntry(formData: FormData) {
    try {
        const admin = await verifySuperAdmin();
        if (!admin) {
            return { success: false, message: 'Akses ditolak. Hanya Super Admin yang diizinkan.' };
        }

        const amountStr = formData.get('amount') as string;
        const description = formData.get('description') as string;

        if (!amountStr || !description) {
            return { success: false, message: 'Harap melengkapi nominal dan deskripsi catatan kas.' };
        }

        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return { success: false, message: 'Nominal tidak valid (harus angka positif).' };
        }

        await prisma.$transaction(async (tx) => {
            // P0: Gunakan SELECT FOR UPDATE untuk mencegah Race Condition dan mendapatkan saldo terakhir dengan aman
            const lastLedgers = await tx.$queryRaw<{balance: any}[]>`SELECT balance FROM OperationalLedger ORDER BY createdAt DESC LIMIT 1 FOR UPDATE`;
            const currentBalance = lastLedgers.length > 0 ? Number(lastLedgers[0].balance) : 0;
            const newBalance = currentBalance + amount;

            await tx.operationalLedger.create({
                data: {
                    type: 'TOP_UP',
                    amount: amount,
                    balance: newBalance,
                    description: description,
                    createdBy: admin.id
                }
            });
        });

        revalidatePath('/admin');
        revalidatePath('/admin/ledger');

        return { success: true, message: 'Berhasil melakukan Top-Up saldo kas!' };

    } catch (error) {
        console.error('Error addLedgerEntry:', error);
        return { success: false, message: 'Terjadi kegagalan sistem saat mendaftarkan nilai kas.' };
    }
}

/**
 * Super Admin Menghapus Transaksi Manual di Ledger.
 * Peringatan: Menghapus kredit yang terkunci ke PayoutBatch (pencairan bon) sangat tidak disarankan
 * (mesti dihapus dari panel bon), jadi kita lindungi hapus spesial untuk yg independen / Top-Up.
 */
export async function deleteLedgerEntry(ledgerId: string) {
    try {
        const admin = await verifySuperAdmin();
        if (!admin) {
            return { success: false, message: 'Akses ditolak. Eksekusi ini terlarang.' };
        }

        const ledger = await prisma.operationalLedger.findUnique({
            where: { id: ledgerId },
            include: { payoutBatch: true }
        });

        if (!ledger) {
            return { success: false, message: 'Data Riwayat Kas tidak ditemukan.' };
        }

        // Pengamanan: Cegah penghapusan catatan yang terkait erat dari bon cair otomatis (CREDIT SYSTEM)
        // agar sinkronisasi kas tak rusak tanpa sepengetahuan laporan keuangan.
        if (ledger.payoutBatchId) {
            return { success: false, message: 'Gagal. Kas ini adalah bukti sah pencairan Batch Laporan Bon. Anda harus mereset Status Laporannya dari Panel "Kelola Bon" untuk menarik ulang uang ini.' };
        }

        // Eksekusi penghapusan riwayat independen menggunakan Delta Update O(1) atomik
        await prisma.$transaction(async (tx) => {
            await tx.operationalLedger.delete({
                where: { id: ledgerId }
            });

            // Hitung delta pergeseran saldo
            const amount = Number(ledger.amount);
            const delta = ledger.type === 'TOP_UP' ? -amount : amount;

            // Update running balance semua entri setelahnya secara atomik di database
            await tx.$executeRaw`
                UPDATE OperationalLedger
                SET balance = balance + ${delta}
                WHERE createdAt > ${ledger.createdAt}
            `;
        });

        revalidatePath('/admin');
        revalidatePath('/admin/ledger');

        return { success: true, message: 'Entri kas telah dikosongkan secara permanen.' };
    } catch (error) {
        console.error('Error deleteLedgerEntry:', error);
        return { success: false, message: 'Sistem mengalami eror ketika berusaha melenyapkan kas.' };
    }
}

/**
 * Super Admin Mengedit Transaksi Manual di Ledger.
 * Peringatan: Sama seperti Delete, mencegah pengeditan untuk ledger otomatis.
 */
export async function updateLedgerEntry(formData: FormData) {
    try {
        const admin = await verifySuperAdmin();
        if (!admin) {
            return { success: false, message: 'Akses ditolak.' };
        }

        const id = formData.get('id') as string;
        const amountStr = formData.get('amount') as string;
        const description = formData.get('description') as string;

        if (!id || !amountStr || !description) {
            return { success: false, message: 'Data tidak lengkap.' };
        }

        const ledger = await prisma.operationalLedger.findUnique({
            where: { id }
        });

        if (!ledger) {
            return { success: false, message: 'Data Riwayat Kas tidak ditemukan.' };
        }

        if (ledger.payoutBatchId) {
            return { success: false, message: 'Kas hasil pencairan Bon otomatis tidak bisa dimanipulasi dari halaman ini.' };
        }

        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) {
            return { success: false, message: 'Nominal tidak valid.' };
        }

        const oldAmount = Number(ledger.amount);
        const delta = ledger.type === 'TOP_UP' ? (amount - oldAmount) : (oldAmount - amount);

        // Eksekusi pembaruan riwayat menggunakan Delta Update O(1) atomik
        await prisma.$transaction(async (tx) => {
            await tx.operationalLedger.update({
                where: { id },
                data: {
                    amount: amount,
                    description: description,
                    balance: Number(ledger.balance) + delta
                }
            });

            // Update running balance semua entri setelahnya secara atomik di database
            await tx.$executeRaw`
                UPDATE OperationalLedger
                SET balance = balance + ${delta}
                WHERE createdAt > ${ledger.createdAt}
            `;
        });

        revalidatePath('/admin');
        revalidatePath('/admin/ledger');

        return { success: true, message: 'Perubahan riwayat kas berhasil direkam!' };

    } catch (error) {
        console.error('Error updateLedgerEntry:', error);
        return { success: false, message: 'Terjadi kegagalan saat mengedit nilai kas.' };
    }
}
