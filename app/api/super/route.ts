import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const superEmail = 'admin@vandiza.com';
    const superPassword = 'Azura@2025';

    // 1. Acak password menggunakan Bcrypt agar tetap aman di database
    const hashedPassword = await bcrypt.hash(superPassword, 10);

    // 2. Gunakan UPSERT (Update or Insert)
    // Ini memastikan akun kebal. Jika terhapus/berubah, ia akan diciptakan ulang dengan data ini.
    await prisma.user.upsert({
      where: { email: superEmail },
      update: {
        password: hashedPassword,     // Paksa kembalikan password jika sempat terubah
        role: 'ADMIN',                // Paksa kembalikan jabatan menjadi Admin
        name: 'Super Admin Vandiza'   // Paksa kembalikan nama
      },
      create: {
        name: 'Super Admin Vandiza',
        email: superEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Akun Super Admin (admin@vandiza.com) berhasil ditanamkan secara permanen!'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}