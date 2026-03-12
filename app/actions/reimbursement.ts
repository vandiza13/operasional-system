'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { put, del } from '@vercel/blob'; // [BARU] Import del untuk menghapus sampah file
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/session';
import { AttachmentType } from '@prisma/client';

// Fungsi bantuan untuk mengunggah file
async function uploadFile(file: File | null, folderName: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`; // Bersihkan nama file
  const isVercelEnvironment = process.env.VERCEL === '1' || process.cwd().includes('/var/task');
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // 1. Prioritas: Gunakan Vercel Blob
  if (blobToken) {
    try {
      const blob = await put(`${folderName}/${fileName}`, file, { access: 'public', addRandomSuffix: true });
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
    const categoryId = formData.get('categoryId') as string;
    const expenseDate = formData.get('expenseDate') as string;

    // Fitur Baru KM & Nopol
    const kmBeforeStr = formData.get('kmBefore') as string;
    const kmAfterStr = formData.get('kmAfter') as string;
    const kmBefore = kmBeforeStr ? parseInt(kmBeforeStr, 10) : null;
    const kmAfter = kmAfterStr ? parseInt(kmAfterStr, 10) : null;
    const vehiclePlate = formData.get('vehiclePlate') as string | null; // [TERJAGA] Nopol dipertahankan

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, message: 'Nominal tidak valid!' };
    if (!expenseDate || isNaN(Date.parse(expenseDate))) return { success: false, message: 'Tanggal pengeluaran tidak valid!' };
    if (!categoryId) return { success: false, message: 'Kategori wajib dipilih!' };

    // 2. CEK SESI USER
    const session = await getSession();
    if (!session || !session.userId) return { success: false, message: 'Sesi habis! Silakan login kembali.' };
    const userId = session.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: 'User tidak ditemukan.' };

    // 3. AMBIL FILE
    const files = {
      RECEIPT: formData.get('receipt') as File,
      EVIDENCE_1: formData.get('evidence1') as File,  // KM Sebelum
      EVIDENCE_2: formData.get('evidence2') as File,  // KM Sesudah
    };
    const optionalEvidence3 = formData.get('evidence3') as File | null;

    // 4. VALIDASI 3 FILE WAJIB (Maks 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    for (const [key, file] of Object.entries(files)) {
      if (!file || file.size === 0) return { success: false, message: `File ${key} wajib diunggah!` };
      if (file.size > MAX_FILE_SIZE) return { success: false, message: `Ukuran file ${key} terlalu besar (Maks 5MB)!` };
      if (!file.type.startsWith('image/')) return { success: false, message: `File ${key} harus berupa gambar!` };
    }

    // Validasi file opsional jika ada
    let hasEvidence3 = false;
    if (optionalEvidence3 && optionalEvidence3.size > 0) {
      if (optionalEvidence3.size > MAX_FILE_SIZE) return { success: false, message: `Ukuran Eviden Tambahan terlalu besar (Maks 5MB)!` };
      if (!optionalEvidence3.type.startsWith('image/')) return { success: false, message: `Eviden Tambahan harus berupa gambar!` };
      hasEvidence3 = true;
    }

    // 5. UPLOAD PARALEL (CEPAT & EFISIEN)
    let urls: (string | null)[] = [];
    let evidence3Url: string | null = null;
    try {
      const uploadPromises = [
        uploadFile(files.RECEIPT, 'receipts'),
        uploadFile(files.EVIDENCE_1, 'evidences'),
        uploadFile(files.EVIDENCE_2, 'evidences')
      ];

      if (hasEvidence3) {
        uploadPromises.push(uploadFile(optionalEvidence3 as File, 'evidences'));
      }

      const results = await Promise.all(uploadPromises);
      urls = results.slice(0, 3);
      if (hasEvidence3) evidence3Url = results[3];

    } catch (uploadError: any) {
      if (String(uploadError).includes('BLOB_READ_WRITE_TOKEN')) {
        return { success: false, message: '⚠️ Sistem belum dikonfigurasi. Hubungi admin (BLOB Token).' };
      }
      return { success: false, message: `Gagal upload file: ${String(uploadError)}` };
    }

    if (urls.some(url => url === null) || (hasEvidence3 && evidence3Url === null)) {
      return { success: false, message: 'Ada gambar yang gagal diunggah.' };
    }

    // 6. INSERT KE DATABASE
    const attachmentsToCreate = [
      { type: 'RECEIPT', fileUrl: urls[0] as string },
      { type: 'EVIDENCE_1', fileUrl: urls[1] as string },
      { type: 'EVIDENCE_2', fileUrl: urls[2] as string },
    ];

    if (hasEvidence3 && evidence3Url) {
      attachmentsToCreate.push({ type: 'EVIDENCE_3', fileUrl: evidence3Url });
    }

    await prisma.expense.create({
      data: {
        userId: userId,
        categoryId: categoryId,
        amount: parseFloat(amount),
        description: description,
        vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null, // [TERJAGA] Simpan Nopol
        kmBefore: kmBefore,
        kmAfter: kmAfter,
        expenseDate: new Date(expenseDate),
        status: 'PENDING',
        attachments: {
          create: attachmentsToCreate as any
        }
      }
    });

    revalidatePath('/submit');
    revalidatePath('/admin');
    return { success: true, message: 'Laporan dan bukti berhasil masuk antrian!' };

  } catch (error) {
    console.error('Submit Error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem internal.' };
  }
}

// ============================================================================
// FUNGSI BARU: AMBIL DATA SPESIFIK UNTUK DI-EDIT OLEH TEKNISI
// ============================================================================
export async function getClaimForEdit(expenseId: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, message: 'Sesi habis.' };
    const userId = session.userId;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, userId: userId },
      include: { attachments: true }
    });

    if (!expense) return { success: false, message: 'Data tidak ditemukan.' };

    if (expense.status !== 'PENDING') {
      return { success: false, message: 'Klaim ini sudah tidak bisa diedit karena statusnya bukan PENDING.' };
    }

    const serializedExpense = {
      ...expense,
      amount: Number(expense.amount),
    };

    return { success: true, expense: serializedExpense };
  } catch (error) {
    console.error('Get Claim Error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

// ============================================================================
// FUNGSI BARU: UPDATE DATA KLAIM OLEH TEKNISI
// ============================================================================
export async function updateReimbursement(expenseId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || !session.userId) return { success: false, message: 'Sesi habis! Silakan login kembali.' };
    const userId = session.userId;

    // 1. Validasi Kepemilikan & Status
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId, userId: userId },
      include: { attachments: true }
    });

    if (!existingExpense) return { success: false, message: 'Data tidak ditemukan.' };
    if (existingExpense.status !== 'PENDING') return { success: false, message: 'Data yang sudah diproses tidak bisa diubah.' };

    // 2. Parsial Data Teks
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const expenseDate = formData.get('expenseDate') as string;

    const kmBeforeStr = formData.get('kmBefore') as string;
    const kmAfterStr = formData.get('kmAfter') as string;
    const kmBefore = kmBeforeStr ? parseInt(kmBeforeStr, 10) : null;
    const kmAfter = kmAfterStr ? parseInt(kmAfterStr, 10) : null;
    const vehiclePlate = formData.get('vehiclePlate') as string | null; // [TERJAGA] Nopol

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, message: 'Nominal tidak valid!' };
    if (!expenseDate || isNaN(Date.parse(expenseDate))) return { success: false, message: 'Tanggal pengeluaran tidak valid!' };
    if (!categoryId) return { success: false, message: 'Kategori wajib dipilih!' };

    // 3. Proses File Baru (Hanya jika diunggah)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const fileKeys: { key: string, type: AttachmentType, folder: string }[] = [
      { key: 'receipt', type: 'RECEIPT', folder: 'receipts' },
      { key: 'evidence1', type: 'EVIDENCE_1', folder: 'evidences' },
      { key: 'evidence2', type: 'EVIDENCE_2', folder: 'evidences' },
      { key: 'evidence3', type: 'EVIDENCE_3', folder: 'evidences' },
    ];

    const updatedAttachments: { id?: string, type: AttachmentType, fileUrl: string }[] = [];
    
    // [BARU] Siapkan array penampung URL sampah untuk Vercel Blob
    const oldBlobUrlsToDelete: string[] = []; 

    const oldAttachmentsMap = new Map(existingExpense.attachments.map(a => [a.type, a]));

    for (const item of fileKeys) {
      const file = formData.get(item.key) as File | null;

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) return { success: false, message: `Ukuran file ${item.key} maks 5MB!` };
        if (!file.type.startsWith('image/')) return { success: false, message: `File ${item.key} harus gambar!` };

        const newUrl = await uploadFile(file, item.folder);
        if (!newUrl) return { success: false, message: `Gagal mengunggah file ${item.key}.` };

        const oldFile = oldAttachmentsMap.get(item.type);
        if (oldFile) {
          updatedAttachments.push({ id: oldFile.id, type: item.type, fileUrl: newUrl });
          
          // [BARU] Jika file lama direplace, tandai URL-nya untuk dihapus
          if (oldFile.fileUrl.includes('blob.vercel-storage.com')) {
              oldBlobUrlsToDelete.push(oldFile.fileUrl);
          }
        } else {
          updatedAttachments.push({ type: item.type, fileUrl: newUrl });
        }
      }
    }

    // 4. Update Database (Atomic Transaction untuk data)
    await prisma.$transaction(async (tx) => {
      // Update Teks
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          categoryId,
          amount: parseFloat(amount),
          description,
          vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null, // [TERJAGA] Update Nopol
          kmBefore,
          kmAfter,
          expenseDate: new Date(expenseDate),
        }
      });

      // Update File (Patching)
      for (const patch of updatedAttachments) {
        if (patch.id) {
          await tx.expenseAttachment.update({
            where: { id: patch.id },
            data: { fileUrl: patch.fileUrl }
          });
        } else {
          await tx.expenseAttachment.create({
            data: { expenseId: expenseId, type: patch.type, fileUrl: patch.fileUrl }
          });
        }
      }
    });

    // 5. [BARU] Hapus foto lama dari Vercel Blob jika transaksi DB di atas sukses
    if (oldBlobUrlsToDelete.length > 0) {
        try {
            await del(oldBlobUrlsToDelete);
            console.log('✅ File lama berhasil dihapus dari Vercel Blob:', oldBlobUrlsToDelete.length);
        } catch (blobErr) {
            console.error('⚠️ Gagal menghapus file lama dari Vercel Blob:', blobErr);
        }
    }

    revalidatePath('/submit');
    revalidatePath('/admin');
    return { success: true, message: 'Perubahan laporan berhasil disimpan!' };

  } catch (error) {
    console.error('Update Claim Error:', error);
    return { success: false, message: 'Terjadi kesalahan internal saat menyimpan perubahan.' };
  }
}