'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function uploadFile(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  
  // Coba upload ke Vercel Blob terlebih dahulu
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log('📤 Attempting Vercel Blob upload...');
      const blob = await put(`receipts/${fileName}`, file, {
        access: 'public',
      });
      console.log('✅ Vercel Blob upload successful:', blob.url);
      return blob.url;
    } catch (error) {
      console.warn('⚠️ Vercel Blob upload failed:', error);
      console.log('📁 Falling back to local storage...');
    }
  } else {
    console.log('⚠️ BLOB_READ_WRITE_TOKEN not set, using local storage');
  }

  // Fallback: Simpan ke local storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(process.cwd(), 'public', 'receipts', fileName);
  
  try {
    await writeFile(filePath, buffer);
    console.log('✅ Local storage upload successful:', `/receipts/${fileName}`);
    return `/receipts/${fileName}`;
  } catch (err) {
    // Buat folder jika belum ada
    const fs = await import('fs');
    if (!fs.existsSync(join(process.cwd(), 'public', 'receipts'))) {
      fs.mkdirSync(join(process.cwd(), 'public', 'receipts'), { recursive: true });
      await writeFile(filePath, buffer);
      console.log('✅ Local storage upload successful (folder created):', `/receipts/${fileName}`);
      return `/receipts/${fileName}`;
    }
    throw err;
  }
}

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

    // 2. Upload file (Vercel Blob atau Local fallback)
    const realEvidenceUrl = await uploadFile(file);

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