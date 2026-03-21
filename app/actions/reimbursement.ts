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

// ============================================================================
// UPDATE: submitReimbursement (Hanya Menerima URL, Bukan File)
// ============================================================================
export async function submitReimbursement(formData: FormData) {
  try {
    // 1. AMBIL & VALIDASI DATA TEKS
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const expenseDate = formData.get('expenseDate') as string;

    const kmBeforeStr = formData.get('kmBefore') as string;
    const kmAfterStr = formData.get('kmAfter') as string;
    const kmBefore = kmBeforeStr ? parseInt(kmBeforeStr, 10) : null;
    const kmAfter = kmAfterStr ? parseInt(kmAfterStr, 10) : null;
    const vehiclePlate = formData.get('vehiclePlate') as string | null;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, message: 'Nominal tidak valid!' };
    if (!expenseDate || isNaN(Date.parse(expenseDate))) return { success: false, message: 'Tanggal pengeluaran tidak valid!' };
    if (!categoryId) return { success: false, message: 'Kategori wajib dipilih!' };

    // 2. CEK SESI USER
    const session = await getSession();
    if (!session || !session.userId) return { success: false, message: 'Sesi habis! Silakan login kembali.' };
    const userId = session.userId;

    // 3. AMBIL URL GAMBAR (Hasil dari Direct Client Upload)
    // [SOP: SINKRONISASI DATA] Kita ubah ekspektasi dari 'receipt' menjadi 'receiptUrl'
    const receiptUrl = formData.get('receiptUrl') as string;
    const evidence1Url = formData.get('evidence1Url') as string;
    const evidence2Url = formData.get('evidence2Url') as string;
    const evidence3Url = formData.get('evidence3Url') as string | null;

    if (!receiptUrl || !evidence1Url || !evidence2Url) {
      return { success: false, message: 'URL Foto wajib (Struk & 2 Bukti) tidak ditemukan!' };
    }

    // 4. INSERT KE DATABASE (Sangat Cepat & Ringan)
    const attachmentsToCreate = [
      { type: 'RECEIPT', fileUrl: receiptUrl },
      { type: 'EVIDENCE_1', fileUrl: evidence1Url },
      { type: 'EVIDENCE_2', fileUrl: evidence2Url },
    ];

    if (evidence3Url) {
      attachmentsToCreate.push({ type: 'EVIDENCE_3', fileUrl: evidence3Url });
    }

    await prisma.expense.create({
      data: {
        userId: userId,
        categoryId: categoryId,
        amount: parseFloat(amount),
        description: description,
        vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
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
    const vehiclePlate = formData.get('vehiclePlate') as string | null;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, message: 'Nominal tidak valid!' };
    if (!expenseDate || isNaN(Date.parse(expenseDate))) return { success: false, message: 'Tanggal pengeluaran tidak valid!' };
    if (!categoryId) return { success: false, message: 'Kategori wajib dipilih!' };

    // 3. Proses URL Baru (Hanya jika ada URL yang diubah/diunggah ulang oleh klien)
    const newUrls = {
      RECEIPT: formData.get('receiptUrl') as string | null,
      EVIDENCE_1: formData.get('evidence1Url') as string | null,
      EVIDENCE_2: formData.get('evidence2Url') as string | null,
      EVIDENCE_3: formData.get('evidence3Url') as string | null,
    };

    const oldBlobUrlsToDelete: string[] = [];
    const oldAttachmentsMap = new Map(existingExpense.attachments.map(a => [a.type, a]));
    const updatedAttachments: { id?: string, type: AttachmentType, fileUrl: string }[] = [];

    // [LOGIKA ALGORITMA]: Cek mana saja foto yang diganti
    for (const [type, newUrl] of Object.entries(newUrls)) {
      if (newUrl) { // Jika klien mengirim URL baru untuk tipe ini
        const oldFile = oldAttachmentsMap.get(type as AttachmentType);
        if (oldFile) {
          updatedAttachments.push({ id: oldFile.id, type: type as AttachmentType, fileUrl: newUrl });
          if (oldFile.fileUrl.includes('blob.vercel-storage.com')) {
            oldBlobUrlsToDelete.push(oldFile.fileUrl); // Tandai URL lama untuk dihapus
          }
        } else {
          updatedAttachments.push({ type: type as AttachmentType, fileUrl: newUrl });
        }
      }
    }

    // 4. Update Database (Atomic Transaction)
    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id: expenseId },
        data: {
          categoryId,
          amount: parseFloat(amount),
          description,
          vehiclePlate: vehiclePlate ? vehiclePlate.trim().toUpperCase() : null,
          kmBefore,
          kmAfter,
          expenseDate: new Date(expenseDate),
        }
      });

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

    // 5. Hapus foto lama dari Vercel Blob
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