'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';

// Fungsi bantuan untuk mengunggah file dengan fallback ke local storage
async function uploadFile(file: File | null, folderName: string): Promise<string | null> {
  if (!file || file.size === 0) {
    return null;
  }

  const fileName = `${Date.now()}-${file.name}`;
  
  // Coba upload ke Vercel Blob terlebih dahulu
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      console.log(`📤 Attempting Vercel Blob upload for ${folderName}...`);
      const blob = await put(`${folderName}/${fileName}`, file, {
        access: 'public',
      });
      console.log(`✅ Vercel Blob upload successful: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.warn(`⚠️ Vercel Blob upload failed for ${folderName}:`, error);
      console.log('📁 Falling back to local storage...');
    }
  } else {
    console.log(`⚠️ BLOB_READ_WRITE_TOKEN not set, using local storage for ${folderName}`);
  }

  // Fallback: Simpan ke local storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(process.cwd(), 'public', folderName, fileName);
  
  try {
    await writeFile(filePath, buffer);
    console.log(`✅ Local storage upload successful: /${folderName}/${fileName}`);
    return `/${folderName}/${fileName}`;
  } catch (err) {
    // Buat folder jika belum ada
    const fs = await import('fs');
    const folderPath = join(process.cwd(), 'public', folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      await writeFile(filePath, buffer);
      console.log(`✅ Local storage upload successful (folder created): /${folderName}/${fileName}`);
      return `/${folderName}/${fileName}`;
    }
    throw err;
  }
}

export async function submitReimbursement(formData: FormData) {
  try {
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    
    // 1. Ambil 4 file dari form berdasarkan nama input-nya
    const receiptFile = formData.get('receipt') as File;
    const ev1File = formData.get('evidence1') as File | null;
    const ev2File = formData.get('evidence2') as File | null;
    const ev3File = formData.get('evidence3') as File | null;
    
    // Validasi Bon/Struk (Wajib ada)
    if (!receiptFile || receiptFile.size === 0) {
      return { success: false, message: 'Foto Bon/Struk WAJIB diunggah!' };
    }

    // 2. Upload foto secara paralel (bersamaan) agar cepat
    const [receiptUrl, evidence1Url, evidence2Url, evidence3Url] = await Promise.all([
      uploadFile(receiptFile, 'receipts'),
      uploadFile(ev1File, 'evidences'),
      uploadFile(ev2File, 'evidences'),
      uploadFile(ev3File, 'evidences')
    ]);

    // 3. AMBIL DATA USER DARI COOKIE LOGIN
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    // Jika tidak ada cookie (belum login/dihapus), tolak laporannya
    if (!userId) {
      return { success: false, message: 'Sesi habis! Silakan login kembali.' };
    }

    // Verifikasi user ada di database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return { success: false, message: 'User tidak ditemukan. Silakan login kembali.' };
    }

    // 4. Simpan ke database dengan semua 4 foto URLs
    if (!receiptUrl) {
      return { success: false, message: 'Gagal upload foto bon/struk. Coba lagi.' };
    }

    await prisma.reimbursement.create({
      data: {
        amount: parseFloat(amount),
        description: description,
        receiptUrl: receiptUrl,
        evidence1Url: evidence1Url,
        evidence2Url: evidence2Url,
        evidence3Url: evidence3Url,
        status: 'PENDING',
        userId: userId
      }
    });

    revalidatePath('/submit');
    revalidatePath('/admin');
    
    return { success: true, message: 'Laporan dan semua foto berhasil dikirim!' };

  } catch (error) {
    console.error('Error saving reimbursement:', error);
    return { success: false, message: 'Gagal mengirim laporan. Coba lagi.' };
  }
}