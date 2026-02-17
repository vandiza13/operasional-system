'use server'

import prisma from '@/lib/prisma';

/**
 * GET /api/reset - Cek status database
 */
export async function checkDatabaseStatus() {
  try {
    const totalUsers = await prisma.user.count();
    const totalExpenses = await prisma.expense.count();

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
        total_expenses: totalExpenses
      },
      users: users,
      message: `Database memiliki ${totalUsers} user dan ${totalExpenses} expense`
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
    // Hapus expense attachments terlebih dahulu
    const attachmentCount = await prisma.expenseAttachment.deleteMany({});
    
    // Hapus expenses
    const expenseCount = await prisma.expense.deleteMany({});
    
    // Hapus expense categories
    const categoryCount = await prisma.expenseCategory.deleteMany({});
    
    // Hapus semua users
    const userCount = await prisma.user.deleteMany({});

    return {
      success: true,
      message: `✅ Database berhasil dihapus total!\nHapus user: ${userCount.count}\nHapus expense: ${expenseCount.count}\nHapus attachment: ${attachmentCount.count}\nHapus kategori: ${categoryCount.count}`,
      deletedRecords: {
        users: userCount.count,
        expenses: expenseCount.count,
        attachments: attachmentCount.count,
        categories: categoryCount.count
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
