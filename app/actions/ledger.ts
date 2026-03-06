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
 * Menghitung ulang seluruh field `balance` dari awal sampai akhir.
 * Digunakan tiap kali ada mutasi insert manual atau delete history
 * agar riwayat saldo berkesinambungan dan tidak rusak.
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

        // Jalankan seluruh pembaruan saldo melalui satu traksaksi massal aman
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

        // 1. Tambahkan raw entry dengan balance dummy sementara (0)
        await prisma.operationalLedger.create({
            data: {
                type: 'TOP_UP',
                amount: amount,
                balance: 0, // Akan di-recalculate setelah ini
                description: description,
                createdBy: admin.id
            }
        });

        // 2. Memicu chain reaction kalkulasi ulang seluruh saldo
        const recalculateOk = await recalculateBalances();

        if (!recalculateOk) {
            return { success: false, message: 'Dana tercatat, namun terjadi kendala integrasi kalkulasi riwayat akhir. Harap kontak dev.' };
        }

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

        // Eksekusi penghapusan riwayat independen
        await prisma.operationalLedger.delete({
            where: { id: ledgerId }
        });

        // 2. Memicu chain reaction kalkulasi ulang seluruh saldo (merapatkan struktur balance yang rumpang)
        await recalculateBalances();

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

        await prisma.operationalLedger.update({
            where: { id },
            data: {
                amount: amount,
                description: description
            }
        });

        // Kalkulasi ulang berantai karena amount berubah
        const recalculateOk = await recalculateBalances();

        if (!recalculateOk) {
            return { success: false, message: 'Dana tercatat, namun terjadi kendala integrasi kalkulasi. Harap kontak dev.' };
        }

        revalidatePath('/admin');
        revalidatePath('/admin/ledger');

        return { success: true, message: 'Perubahan riwayat kas berhasil direkam!' };

    } catch (error) {
        console.error('Error updateLedgerEntry:', error);
        return { success: false, message: 'Terjadi kegagalan saat mengedit nilai kas.' };
    }
}
