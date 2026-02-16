'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob'; // Import fungsi upload dari Vercel

export async function submitReimbursement(formData: FormData) {
  try {
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    
    // 1. Ambil file gambar dari form
    const file = formData.get('evidence') as File;
    
    // Validasi jika file kosong
    if (!file || file.size === 0) {
      return { success: false, message: 'Foto bukti struk wajib diunggah!' };
    }

    // 2. Upload file ke Vercel Blob
    // Kita tambahkan Date.now() agar nama file tidak bentrok jika ada yang sama
    const blob = await put(`receipts/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const realEvidenceUrl = blob.url; // Ini URL asli dari Vercel Blob!

    // 3. TRIK SEMENTARA: Cari atau buat "Teknisi Budi"
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Teknisi Budi',
          email: 'budi@teknisi.com',
          password: 'password_sementara',
          role: 'TECHNICIAN'
        }
      });
    }

    // 4. Simpan data ke TiDB Database
    await prisma.reimbursement.create({
      data: {
        amount: parseFloat(amount),
        description: description,
        evidenceUrl: realEvidenceUrl, // Simpan URL asli ke database
        status: 'PENDING',
        userId: user.id
      }
    });

    // 5. Refresh cache halaman agar sinkron
    revalidatePath('/submit');
    revalidatePath('/admin'); // Sekalian refresh admin agar datanya langsung muncul
    
    return { success: true, message: 'Laporan dan foto berhasil dikirim ke Admin!' };

  } catch (error) {
    console.error('Error saving reimbursement:', error);
    return { success: false, message: 'Gagal mengirim laporan. Pastikan file gambar valid.' };
  }
}