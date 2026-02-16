'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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