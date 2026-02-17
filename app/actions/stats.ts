'use server'

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function getTechnicianStats() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) return null;

    // 1. Agregasi Total Rupiah (Sangat ringan untuk TiDB)
    const pending = await prisma.expense.aggregate({ _sum: { amount: true }, where: { userId, status: 'PENDING' } });
    const approved = await prisma.expense.aggregate({ _sum: { amount: true }, where: { userId, status: 'APPROVED' } });
    const paid = await prisma.expense.aggregate({ _sum: { amount: true }, where: { userId, status: 'PAID' } });

    // 2. Logika Posisi Antrean (FIFO)
    // Cari klaim milik user ini yang paling lama ngantri
    const oldestApproved = await prisma.expense.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { approvedAt: 'asc' }
    });

    let queuePosition = 0;
    if (oldestApproved?.approvedAt) {
      // Hitung ada berapa antrean orang lain yang disetujui lebih dulu dari klaim user ini
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