import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Perintah sakti untuk menghapus SEMUA data di tabel Reimbursement
    const deleted = await prisma.reimbursement.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: `${deleted.count} data lama berhasil dihapus!` 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}