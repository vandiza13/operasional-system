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
  const isVercelEnvironment = process.env.VERCEL === '1' || process.cwd().includes('/var/task');
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // 1. Prioritas: Gunakan Vercel Blob jika token tersedia
  if (blobToken) {
    try {
      console.log(`📤 Uploading to Vercel Blob: ${folderName}/${fileName}`);
      const blob = await put(`${folderName}/${fileName}`, file, {
        access: 'public',
      });
      console.log(`✅ Vercel Blob success: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.warn(`⚠️ Vercel Blob failed:`, error);
      // Jika Blob gagal tapi token ada, jangan fallback - return error
      throw new Error(`Vercel Blob upload failed: ${String(error)}`);
    }
  }

  // 2. Jika di Vercel tapi tidak ada token, return error message
  if (isVercelEnvironment) {
    const errorMsg = 
      `⚠️ File upload requires BLOB_READ_WRITE_TOKEN in Vercel environment.\n` +
      `Please set BLOB_READ_WRITE_TOKEN in Vercel Project Settings → Environment Variables.\n` +
      `Without it, file uploads are disabled in production.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 3. Local development: Fallback ke local storage
  console.log(`📁 BLOB token not set, using local storage for ${folderName}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(process.cwd(), 'public', folderName, fileName);
  
  try {
    await writeFile(filePath, buffer);
    console.log(`✅ Local storage: /${folderName}/${fileName}`);
    return `/${folderName}/${fileName}`;
  } catch (err: any) {
    // Coba buat folder dan simpan lagi
    const fs = await import('fs');
    const folderPath = join(process.cwd(), 'public', folderName);
    
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      await writeFile(filePath, buffer);
      console.log(`✅ Local storage (created folder): /${folderName}/${fileName}`);
      return `/${folderName}/${fileName}`;
    } catch (error) {
      console.error(`❌ Local storage failed:`, error);
      throw new Error(`Failed to save file locally: ${String(error)}`);
    }
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
    let receiptUrl: string | null = null;
    let evidence1Url: string | null = null;
    let evidence2Url: string | null = null;
    let evidence3Url: string | null = null;

    try {
      [receiptUrl, evidence1Url, evidence2Url, evidence3Url] = await Promise.all([
        uploadFile(receiptFile, 'receipts'),
        uploadFile(ev1File, 'evidences'),
        uploadFile(ev2File, 'evidences'),
        uploadFile(ev3File, 'evidences')
      ]);
    } catch (uploadError: any) {
      const errorMessage = String(uploadError?.message || uploadError);
      console.error('Upload error:', errorMessage);
      
      // Jika BLOB token tidak set di Vercel
      if (errorMessage.includes('BLOB_READ_WRITE_TOKEN')) {
        return { 
          success: false, 
          message: '⚠️ Sistem penyimpanan file belum dikonfigurasi.\n\nHubungi admin untuk set BLOB_READ_WRITE_TOKEN di Vercel Project Settings.' 
        };
      }
      
      return { success: false, message: `Gagal upload file: ${errorMessage}` };
    }

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