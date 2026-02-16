'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// Fungsi untuk menyetujui (Approve) laporan
export async function approveReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await prisma.reimbursement.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(), // WAKTU INI YANG MENJADI KUNCI ANTRIAN FIFO
      }
    });
    revalidatePath('/admin'); // Refresh halaman otomatis
  } catch (error) {
    console.error('Gagal approve:', error);
  }
}

// Fungsi untuk menandai uang sudah cair (Paid)
export async function payReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await prisma.reimbursement.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      }
    });
    revalidatePath('/admin');
  } catch (error) {
    console.error('Gagal bayar:', error);
  }
}

export async function createTechnician(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // 1. Cek apakah email sudah dipakai agar tidak ganda
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: 'Gagal: Email sudah terdaftar di sistem!' };
    }

    // 2. Acak password demi keamanan tingkat tinggi!
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Simpan ke database dengan role TECHNICIAN
    await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: 'TECHNICIAN'
      }
    });

    revalidatePath('/admin'); // Refresh halaman admin agar data terbaru muncul
    return { success: true, message: `Berhasil! Akun Teknisi ${name} siap digunakan.` };

  } catch (error) {
    console.error('Gagal membuat teknisi:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat membuat akun.' };
  }
}