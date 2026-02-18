'use server'

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function getTechnicianStats(month?: string) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) return null;

    // ==========================================
    // 1. LOGIKA FILTER BULAN (DIKUNCI KE WIB / UTC+7)
    // ==========================================
    let dateFilter = {};
    
    if (month) {
      const year = parseInt(month.split('-')[0]);
      const monthIndex = parseInt(month.split('-')[1]) - 1;
      
      // Jam 00:00 WIB = Jam 17:00 UTC (Hari sebelumnya)
      const startDate = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
      
      // Jam 23:59:59 WIB = Jam 16:59:59 UTC
      const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23 - 7, 59, 59, 999));
      
      dateFilter = {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        }
      };
    }

    // ==========================================
    // 2. DATA KEUANGAN (TERKENA FILTER BULAN)
    // ==========================================
    const pending = await prisma.expense.aggregate({ 
      _sum: { amount: true }, 
      where: { userId, status: 'PENDING', ...dateFilter } 
    });
    const approved = await prisma.expense.aggregate({ 
      _sum: { amount: true }, 
      where: { userId, status: 'APPROVED', ...dateFilter } 
    });
    const paid = await prisma.expense.aggregate({ 
      _sum: { amount: true }, 
      where: { userId, status: 'PAID', ...dateFilter } 
    });

    // ==========================================
    // 3. POSISI ANTREAN (TIDAK BOLEH DI-FILTER BULAN)
    // ==========================================
    // Antrean bersifat "sepanjang masa" (FIFO), jadi jangan gunakan dateFilter di sini
    const oldestApproved = await prisma.expense.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { approvedAt: 'asc' }
    });

    let queuePosition = 0;
    if (oldestApproved?.approvedAt) {
      const peopleAhead = await prisma.expense.count({
        where: { status: 'APPROVED', approvedAt: { lt: oldestApproved.approvedAt } }
      });
      queuePosition = peopleAhead + 1;
    }

    return {
      pending: Number(pending._sum.amount || 0),
      approved: Number(approved._sum.amount || 0),
      paid: Number(paid._sum.amount || 0),
      queuePosition
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// ============================================================================
// FUNGSI BARU: AMBIL RIWAYAT KLAIM TEKNISI (DENGAN FEEDBACK REJECT)
// ============================================================================

export interface ClaimHistory {
  id: string;
  expenseDate: Date;
  categoryName: string;
  amount: number;
  status: string;
  description: string | null;
  rejectionReason: string | null;
  createdAt: Date;
}

export async function getTechnicianClaims(month?: string): Promise<ClaimHistory[] | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) return null;

    // Filter bulan (sama seperti getTechnicianStats)
    let dateFilter = {};
    if (month) {
      const year = parseInt(month.split('-')[0]);
      const monthIndex = parseInt(month.split('-')[1]) - 1;
      const startDate = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23 - 7, 59, 59, 999));
      dateFilter = {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        }
      };
    }

    const expenses = await prisma.expense.findMany({
      where: { 
        userId, 
        ...dateFilter 
      },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse rejection reason dari description
    const claims: ClaimHistory[] = expenses.map(expense => {
      let rejectionReason: string | null = null;
      
      // Cek apakah ada prefix "REJECTED:" di description
      if (expense.description && expense.description.includes('REJECTED:')) {
        const match = expense.description.match(/REJECTED:\s*(.+?)(?:\n|$)/);
        if (match) {
          rejectionReason = match[1].trim();
        }
      }

      return {
        id: expense.id,
        expenseDate: expense.expenseDate,
        categoryName: expense.category.name,
        amount: Number(expense.amount),
        status: expense.status,
        description: expense.description,
        rejectionReason,
        createdAt: expense.createdAt
      };
    });

    return claims;
  } catch (error) {
    console.error('Error fetching technician claims:', error);
    return null;
  }
}
