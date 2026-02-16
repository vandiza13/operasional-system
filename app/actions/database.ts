'use server'

import prisma from '@/lib/prisma';

/**
 * GET /api/reset - Cek status database
 */
export async function checkDatabaseStatus() {
  try {
    const totalUsers = await prisma.user.count();
    const totalReimbursements = await prisma.reimbursement.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return {
      success: true,
      statistics: {
        total_users: totalUsers,
        total_reimbursements: totalReimbursements
      },
      users: users,
      message: `Database memiliki ${totalUsers} user dan ${totalReimbursements} reimbursement`
    };
  } catch (error) {
    console.error('Database status error:', error);
    return {
      success: false,
      message: 'Gagal mengecek status database',
      error: String(error)
    };
  }
}

/**
 * POST /api/reset - Hapus SEMUA data di database (⚠️ DANGEROUS!)
 */
export async function completeDeleteAllData() {
  try {
    // Hapus reimbursements terlebih dahulu (foreign key constraint)
    const reimbursementCount = await prisma.reimbursement.deleteMany({});
    
    // Hapus semua users
    const userCount = await prisma.user.deleteMany({});

    return {
      success: true,
      message: `✅ Database berhasil dihapus total!\nHapus user: ${userCount.count}\nHapus reimbursement: ${reimbursementCount.count}`,
      deletedRecords: {
        users: userCount.count,
        reimbursements: reimbursementCount.count
      }
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      message: 'Gagal menghapus data database',
      error: String(error)
    };
  }
}
