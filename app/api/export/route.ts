import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { getSession } from '@/lib/session';

// Paksa Dynamic agar selalu mengambil data terbaru
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. CEK OTENTIKASI ADMIN
    const session = await getSession();
    if (!session || !session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. AMBIL PARAMETER TANGGAL & STATUS
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const statusParam = searchParams.get('status'); 

    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(`${startDateParam}T00:00:00+07:00`);
      endDate = new Date(`${endDateParam}T23:59:59+07:00`);
    } else {
      const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
      const currentDateWIB = new Date(nowStr);
      const year = currentDateWIB.getFullYear();
      const monthIndex = currentDateWIB.getMonth();

      startDate = new Date(Date.UTC(year, monthIndex, 1, -7, 0, 0, 0));
      endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23 - 7, 59, 59, 999));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (statusParam && statusParam !== 'ALL') {
      const statuses = statusParam.split(',');
      if (statuses.length === 1) {
        whereClause.status = statuses[0];
      } else {
        whereClause.status = { in: statuses };
      }
    }

    // 3. TARIK DATA DARI DATABASE
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        user: true, 
        category: true, 
        approver: true, 
        attachments: {
          where: { type: 'RECEIPT' }
        }
      },
      orderBy: {
        expenseDate: 'asc', 
      },
    });

    // 4. BUAT WORKBOOK EXCEL
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Pengeluaran');

    // Setup Header Kolom (Menambahkan Plat Kendaraan)
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Nama Teknisi', key: 'technician', width: 25 },
      { header: 'NIK', key: 'nik', width: 15 },
      { header: 'Posisi/Jabatan', key: 'position', width: 20 },
      { header: 'No. HP', key: 'phone', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Keterangan / No Tiket', key: 'description', width: 40 },
      { header: 'Plat Kendaraan', key: 'vehiclePlate', width: 18 }, // [BARU] Tambahan Kolom Plat
      { header: 'KM Sebelum', key: 'kmBefore', width: 15 },
      { header: 'KM Sesudah', key: 'kmAfter', width: 15 },
      { header: 'Nominal (Rp)', key: 'amount', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Disetujui Oleh', key: 'approver', width: 20 },
      { header: 'Link Bukti (Struk)', key: 'receipt_url', width: 45 },
    ];

    // Styling Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, 
    };

    // 5. ISI DATA BARIS PER BARIS
    expenses.forEach((item, index) => {

      const dateObj = new Date(item.expenseDate);
      const day = dateObj.toLocaleString('en-GB', { day: '2-digit', timeZone: 'Asia/Jakarta' });
      const month = dateObj.toLocaleString('en-GB', { month: '2-digit', timeZone: 'Asia/Jakarta' });
      const yearStr = dateObj.toLocaleString('en-GB', { year: 'numeric', timeZone: 'Asia/Jakarta' });
      const time = dateObj.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const formattedDate = `${day}/${month}/${yearStr} ${time} WIB`;

      const receiptUrl = item.attachments.length > 0 ? item.attachments[0].fileUrl : '-';

      const row = sheet.addRow({
        no: index + 1,
        date: formattedDate,
        technician: item.user?.name || 'Unknown',
        nik: item.user?.nik || '-',
        position: item.user?.position || '-',
        phone: item.user?.phone || '-',
        category: item.category?.name || '-',
        description: item.description || '-',
        vehiclePlate: item.vehiclePlate || '-', // [BARU] Isi data Plat Kendaraan
        kmBefore: item.kmBefore ?? '-',
        kmAfter: item.kmAfter ?? '-',
        amount: Number(item.amount),
        status: item.status,
        approver: item.approver?.name || '-',
        receipt_url: receiptUrl
      });

      row.getCell('amount').numFmt = '"Rp" #,##0';

      const statusCell = row.getCell('status');
      if (item.status === 'PAID') {
        statusCell.font = { color: { argb: 'FF10B981' }, bold: true }; 
      } else if (item.status === 'PENDING') {
        statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true }; 
      } else if (item.status === 'REJECTED') {
        statusCell.font = { color: { argb: 'FFEF4444' }, bold: true }; 
      }
    });

    const totalRow = sheet.addRow({
      description: 'TOTAL PENGELUARAN:',
      amount: expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    });
    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = '"Rp" #,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const formatDateForFile = (d: Date) => d.toLocaleDateString('id-ID', { year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Jakarta' }).replace(/\//g, '');
    const fileName = `Laporan-OpsClaim-${formatDateForFile(startDate)}-${formatDateForFile(endDate)}.xlsx`;

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