'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

// Pengecekan keamanan akun yang dilindungi
const PROTECTED_EMAILS = process.env.PROTECTED_ADMIN_EMAILS?.split(',') || [];

export async function updateMyProfile(formData: FormData) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { success: false, message: 'Sesi habis, silakan login kembali.' };
        }
        const userId = session.userId;

        const name = formData.get('name') as string;
        const email = formData.get('email') as string;

        // Khusus teknisi
        const nik = formData.get('nik') as string | null;
        const phone = formData.get('phone') as string | null;
        const position = formData.get('position') as string | null;

        if (!name || !email) {
            return { success: false, message: 'Nama dan Email wajib diisi!' };
        }

        // Cek apakah email sudah dipakai user lain
        const existingEmail = await prisma.user.findFirst({
            where: {
                email: email,
                id: { not: userId }
            }
        });

        if (existingEmail) {
            return { success: false, message: 'Email tersebut sudah digunakan oleh pengguna lain!' };
        }

        // Update data
        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                ...(nik !== null && { nik }),
                ...(phone !== null && { phone }),
                ...(position !== null && { position }),
            }
        });

        revalidatePath('/profile');
        revalidatePath('/admin');
        revalidatePath('/submit');

        return { success: true, message: 'Profil berhasil diperbarui!' };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, message: 'Gagal memperbarui profil. Terjadi kesalahan server.' };
    }
}

export async function updateMyPassword(formData: FormData) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return { success: false, message: 'Sesi habis, silakan login kembali.' };
        }
        const userId = session.userId;

        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return { success: false, message: 'Semua kolom password wajib diisi!' };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, message: 'Password Baru & Konfirmasi Password tidak cocok!' };
        }

        if (newPassword.length < 6) {
            return { success: false, message: 'Password baru minimal 6 karakter!' };
        }

        // Ambil user dari database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return { success: false, message: 'Pengguna tidak ditemukan.' };
        }

        // Verifikasi password lama
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return { success: false, message: 'Password Saat Ini salah!' };
        }

        // Proteksi untuk super admin (opsional, tapi disarankan)
        if (PROTECTED_EMAILS.includes(user.email) && user.role === 'SUPER_ADMIN') {
            return {
                success: false,
                message: 'Akun Super Admin yang dilindungi tidak dapat diubah passwordnya dari panel ini.'
            };
        }

        // Hash & update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return { success: true, message: 'Password berhasil diperbarui!' };
    } catch (error) {
        console.error('Error updating password:', error);
        return { success: false, message: 'Gagal mereset password. Terjadi kesalahan server.' };
    }
}
