'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { cookies } from 'next/headers';
import { AttachmentType } from '@prisma/client';

// Fungsi bantuan untuk mengunggah file (TETAP SAMA SEPERTI MILIK ANDA)
async function uploadFile(file: File | null, folderName: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`; // Bersihkan nama file
  const isVercelEnvironment = process.env.VERCEL === '1' || process.cwd().includes('/var/task');
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // 1. Prioritas: Gunakan Vercel Blob
  if (blobToken) {
    try {
      const blob = await put(`${folderName}/${fileName}`, file, { access: 'public' });
      return blob.url;
    } catch (error) {
      throw new Error(`Vercel Blob upload failed: ${String(error)}`);
    }
  }

  // 2. Jika di Vercel tapi tidak ada token
  if (isVercelEnvironment) {
    throw new Error(`⚠️ File upload requires BLOB_READ_WRITE_TOKEN in Vercel environment.`);
  }

  // 3. Fallback: Local storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = join(process.cwd(), 'public', folderName, fileName);
  try {
    await writeFile(filePath, buffer);
    return `/${folderName}/${fileName}`;
  } catch (err: any) {
    const fs = await import('fs');
    const folderPath = join(process.cwd(), 'public', folderName);
    try {
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
      await writeFile(filePath, buffer);
      return `/${folderName}/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to save file locally: ${String(error)}`);
    }
  }
}

export async function submitReimbursement(formData: FormData) {
  try {
    // 1. AMBIL & VALIDASI DATA TEKS DULU (Cegah upload sia-sia jika data teks salah)
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    // Tambahan baru sesuai skema
    const categoryId = formData.get('categoryId') as string;
    const expenseDate = formData.get('expenseDate') as string;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, message: 'Nominal tidak valid!' };
    if (!expenseDate || isNaN(Date.parse(expenseDate))) return { success: false, message: 'Tanggal pengeluaran tidak valid!' };
    if (!categoryId) return { success: false, message: 'Kategori wajib dipilih!' };

    // 2. CEK SESI USER
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return { success: false, message: 'Sesi habis! Silakan login kembali.' };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User tidak ditemukan.' };

    // 3. AMBIL 4 FILE WAJIB
    const files = {
      RECEIPT: formData.get('receipt') as File,
      EVIDENCE_1: formData.get('evidence1') as File,
      EVIDENCE_2: formData.get('evidence2') as File,
      EVIDENCE_3: formData.get('evidence3') as File,
    };

    // 4. VALIDASI 4 FILE WAJIB (Maks 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    for (const [key, file] of Object.entries(files)) {
      if (!file || file.size === 0) return { success: false, message: `File ${key} wajib diunggah!` };
      if (file.size > MAX_FILE_SIZE) return { success: false, message: `Ukuran file ${key} terlalu besar (Maks 5MB)!` };
      if (!file.type.startsWith('image/')) return { success: false, message: `File ${key} harus berupa gambar!` };
    }

    // 5. UPLOAD PARALEL (CEPAT & EFISIEN)
    let urls: (string | null)[] = [];
    try {
      urls = await Promise.all([
        uploadFile(files.RECEIPT, 'receipts'),
        uploadFile(files.EVIDENCE_1, 'evidences'),
        uploadFile(files.EVIDENCE_2, 'evidences'),
        uploadFile(files.EVIDENCE_3, 'evidences')
      ]);
    } catch (uploadError: any) {
      if (String(uploadError).includes('BLOB_READ_WRITE_TOKEN')) {
        return { success: false, message: '⚠️ Sistem belum dikonfigurasi. Hubungi admin (BLOB Token).' };
      }
      return { success: false, message: `Gagal upload file: ${String(uploadError)}` };
    }

    if (urls.some(url => url === null)) return { success: false, message: 'Ada gambar yang gagal diunggah.' };

    // 6. INSERT KE DATABASE (TiDB Safe - Nested Write)
    // Sekarang menggunakan tabel Expense dan ExpenseAttachment
    await prisma.expense.create({
      data: {
        userId: userId,
        categoryId: categoryId,
        amount: parseFloat(amount),
        description: description,
        expenseDate: new Date(expenseDate),
        status: 'PENDING',
        attachments: {
          create: [
            { type: 'RECEIPT', fileUrl: urls[0] as string },
            { type: 'EVIDENCE_1', fileUrl: urls[1] as string },
            { type: 'EVIDENCE_2', fileUrl: urls[2] as string },
            { type: 'EVIDENCE_3', fileUrl: urls[3] as string },
          ]
        }
      }
    });

    revalidatePath('/submit');
    revalidatePath('/admin');
    return { success: true, message: 'Laporan dan 4 bukti berhasil masuk antrian!' };

  } catch (error) {
    console.error('Submit Error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem internal.' };
  }
}