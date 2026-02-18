import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { cookies } from 'next/headers';

// Paksa Dynamic agar selalu mengambil data terbaru
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. CEK OTENTIKASI ADMIN
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. AMBIL PARAMETER BULAN (Sama persis dengan logika Dashboard)
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month'); // format: "YYYY-MM"

    // Gunakan Waktu Server WIB (UTC+7)
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const currentDateWIB = new Date(nowStr);

    const year = monthParam ? parseInt(monthParam.split('-')[0]) : currentDateWIB.getFullYear();
    const monthIndex = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : currentDateWIB.getMonth();

    // 🔥 KUNCI ZONA WAKTU WIB (UTC+7) AGAR DATA SINKRON DENGAN DASHBOARD
    const startDate = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23 - 7, 59, 59, 999));

    // 3. TARIK DATA DARI DATABASE
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        // Kita ambil semua status atau mau yang APPROVED/PAID saja? 
        // Biasanya Finance butuh semua rekap, tapi bisa difilter di Excel nanti.
      },
      include: {
        user: true, // Untuk ambil nama teknisi
        category: true, // Untuk ambil nama kategori
      },
      orderBy: {
        expenseDate: 'asc', // Urutkan berdasarkan tanggal kejadian
      },
    });

    // 4. BUAT WORKBOOK EXCEL
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Pengeluaran');

    // Setup Header Kolom
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Nama Teknisi', key: 'technician', width: 25 },
      { header: 'NIK', key: 'nik', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Keterangan', key: 'description', width: 40 },
      { header: 'Nominal (Rp)', key: 'amount', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Disetujui Oleh', key: 'approver', width: 20 },
    ];

    // Styling Header (Bold & Background)
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Warna Indigo (sesuai tema app)
    };

    // 5. ISI DATA BARIS PER BARIS
    expenses.forEach((item, index) => {
      const row = sheet.addRow({
        no: index + 1,
        date: item.expenseDate,
        technician: item.user?.name || 'Unknown',
        nik: item.user?.nik || '-',
        category: item.category?.name || '-',
        description: item.description || '-',
        amount: Number(item.amount),
        status: item.status,
        approver: item.approvedById ? 'Admin' : '-', // Bisa diperbaiki fetch nama admin jika perlu
      });

      // Format Rupiah di Excel
      row.getCell('amount').numFmt = '"Rp" #,##0';
      
      // Pewarnaan Status
      const statusCell = row.getCell('status');
      if (item.status === 'PAID') {
        statusCell.font = { color: { argb: 'FF10B981' }, bold: true }; // Emerald
      } else if (item.status === 'PENDING') {
        statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; // Amber
      } else if (item.status === 'REJECTED') {
        statusCell.font = { color: { argb: 'FFEF4444' }, bold: true }; // Red
      }
    });

    // Hitung Total
    const totalRow = sheet.addRow({
      description: 'TOTAL PENGELUARAN:',
      amount: expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    });
    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '"Rp" #,##0';

    // 6. GENERATE FILE BUFFER
    const buffer = await workbook.xlsx.writeBuffer();

    // 7. RETURN RESPONSE DOWNLOAD
    const fileName = `Laporan-OpsClaim-${year}-${monthIndex + 1}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}