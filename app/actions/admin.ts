// app/actions/admin.ts

'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { ExpenseStatus, TransactionType } from '@prisma/client'; // [BARU] Import Enum dari Prisma

// ============================================================================
// 1. FUNGSI PERSETUJUAN (VERIFIKASI SATU PER SATU)
// ============================================================================

// Approve expense report (TETAP SAMA)
export async function approveReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  const newAmount = formData.get('amount') as string;
  
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;

    await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminId,
        amount: newAmount ? parseFloat(newAmount) : undefined,
      }
    });
    revalidatePath('/admin');
    return { success: true, message: 'Expense approved successfully' };
  } catch (error) {
    console.error('Failed to approve:', error);
    return { success: false, message: 'Failed to approve expense' };
  }
}

// Reject expense report (TETAP SAMA)
export async function rejectReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  const reason = formData.get('reason') as string;
  
  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const currentDesc = expense.description || '';
    const newDescription = reason 
      ? `${currentDesc}\n\nREJECTED: ${reason}`.trim()
      : currentDesc;

    await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: newDescription
      }
    });
    revalidatePath('/admin');
    return { success: true, message: 'Expense rejected successfully' };
  } catch (error) {
    console.error('Failed to reject:', error);
    return { success: false, message: 'Failed to reject expense' };
  }
}

// ============================================================================
// 2. FUNGSI SALDO & PENCAIRAN (FITUR BARU)
// ============================================================================

// Ambil Saldo Saat Ini
export async function getCurrentBalance() {
  try {
    const lastLedger = await prisma.operationalLedger.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    return lastLedger ? Number(lastLedger.balance) : 0;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return 0;
  }
}

// Top-Up Saldo Operasional (Dana Masuk)
export async function topUpLedger(formData: FormData) {
  const amountStr = formData.get('amount') as string;
  const description = formData.get('description') as string;
  
  try {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) return { success: false, message: 'Nominal tidak valid!' };

    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;
    if (!adminId) return { success: false, message: 'Sesi habis! Silakan login kembali.' };

    await prisma.$transaction(async (tx) => {
      const lastLedger = await tx.operationalLedger.findFirst({ orderBy: { createdAt: 'desc' } });
      const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;
      const newBalance = currentBalance + amount;

      await tx.operationalLedger.create({
        data: {
          type: TransactionType.TOP_UP,
          amount: amount,
          balance: newBalance,
          description: description || 'Top-Up Saldo Operasional',
          createdBy: adminId
        }
      });
    });

    revalidatePath('/admin');
    return { success: true, message: `Saldo berhasil ditambah: Rp ${amount.toLocaleString('id-ID')}` };
  } catch (error: any) {
    console.error('Failed to Top-Up:', error);
    return { success: false, message: 'Gagal menambah saldo' };
  }
}

// [PENGGANTI payReimbursement LAMA] Pencairan Konsolidasi Per Teknisi
export async function payoutTechnician(formData: FormData) {
  const technicianId = formData.get('technicianId') as string;
  
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;
    if (!adminId) return { success: false, message: 'Sesi admin tidak ditemukan.' };

    // Gunakan Transaction agar jika saldo kurang, semuanya DIBATALKAN otomatis
    const result = await prisma.$transaction(async (tx) => {
      // a. Cari semua bon teknisi ini yang siap cair (APPROVED)
      const approvedExpenses = await tx.expense.findMany({
        where: { userId: technicianId, status: ExpenseStatus.APPROVED }
      });

      if (approvedExpenses.length === 0) {
        throw new Error('Tidak ada bon yang siap dicairkan.');
      }

      // b. Hitung total pencairan
      const totalPayout = approvedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

      // c. Cek Saldo Kas
      const lastLedger = await tx.operationalLedger.findFirst({ orderBy: { createdAt: 'desc' } });
      const currentBalance = lastLedger ? Number(lastLedger.balance) : 0;

      // 🔥 VALIDASI: Tolak jika uang tidak cukup
      if (currentBalance < totalPayout) {
        throw new Error(`Saldo Operasional tidak cukup! (Sisa: Rp ${currentBalance.toLocaleString('id-ID')})`);
      }

      // d. Buat Batch Pencairan
      const payoutBatch = await tx.payoutBatch.create({
        data: {
          technicianId: technicianId,
          totalAmount: totalPayout,
          paidById: adminId,
        }
      });

      // e. Potong Buku Kas
      const newBalance = currentBalance - totalPayout;
      await tx.operationalLedger.create({
        data: {
          type: TransactionType.DISBURSEMENT,
          amount: totalPayout,
          balance: newBalance,
          description: `Pencairan gabungan (${approvedExpenses.length} Bon) untuk Teknisi`,
          createdBy: adminId,
          payoutBatchId: payoutBatch.id
        }
      });

      // f. Ubah Status Bon Menjadi PAID Serentak
      const expenseIds = approvedExpenses.map(e => e.id);
      await tx.expense.updateMany({
        where: { id: { in: expenseIds } },
        data: {
          status: ExpenseStatus.PAID,
          paidAt: new Date(),
          payoutBatchId: payoutBatch.id
        }
      });

      return { totalPayout, count: approvedExpenses.length };
    });

    revalidatePath('/admin');
    revalidatePath('/admin/queue');
    return { success: true, message: `Berhasil mencairkan Rp ${result.totalPayout.toLocaleString('id-ID')} (${result.count} Bon)` };

  } catch (error: any) {
    console.error('Failed to Payout:', error);
    return { success: false, message: error.message || 'Sistem gagal memproses pencairan' };
  }
}

// ============================================================================
// 3. MANAJEMEN PENGGUNA (TETAP SAMA)
// ============================================================================

export async function createTechnician(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nik = formData.get('nik') as string;
  const phone = formData.get('phone') as string;
  const position = formData.get('position') as string;

  if (!name || !email || !password) {
    return { success: false, message: 'Name, email, and password are required' };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { success: false, message: 'Email already registered in the system' };

    if (nik) {
      const existingNik = await prisma.user.findUnique({ where: { nik } });
      if (existingNik) return { success: false, message: 'Employee NIK already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name, email, password: hashedPassword, role: 'TECHNICIAN', nik: nik || null, phone: phone || null, position: position || null
      }
    });

    revalidatePath('/admin/technicians'); 
    return { success: true, message: `Technician ${name} account created successfully` };
  } catch (error) {
    console.error('Failed to create technician:', error);
    return { success: false, message: 'System error while creating account' };
  }
}

export async function editTechnician(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const nik = formData.get('nik') as string;
  const phone = formData.get('phone') as string;
  const position = formData.get('position') as string;

  if (!id || !name || !email) return { success: false, message: 'Incomplete data' };

  try {
    const existing = await prisma.user.findFirst({ where: { email: email, id: { not: id } } });
    if (existing) return { success: false, message: 'Email already used by another user' };

    if (nik) {
      const existingNik = await prisma.user.findFirst({ where: { nik: nik, id: { not: id } } });
      if (existingNik) return { success: false, message: 'NIK already registered by another user' };
    }

    await prisma.user.update({
      where: { id },
      data: { name, email, nik: nik || null, phone: phone || null, position: position || null }
    });

    revalidatePath('/admin/technicians');
    return { success: true, message: 'Technician data updated successfully' };
  } catch (error) {
    console.error('Error updating technician:', error);
    return { success: false, message: 'Failed to update technician' };
  }
}

export async function resetTechnicianPassword(formData: FormData) {
  const id = formData.get('id') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!id || !newPassword || newPassword.length < 6) return { success: false, message: 'New password must be at least 6 characters' };

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    revalidatePath('/admin/technicians');
    return { success: true, message: 'Technician password reset successfully' };
  } catch (error) {
    console.error('Error resetting technician password:', error);
    return { success: false, message: 'Failed to reset technician password' };
  }
}