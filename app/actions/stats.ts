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