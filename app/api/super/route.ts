import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Get credentials from environment variables - NEVER hardcode passwords
    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    const superPassword = process.env.SUPER_ADMIN_PASSWORD;

    // Validate environment variables are set
    if (!superEmail || !superPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Super admin credentials not configured. Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables.' 
        }, 
        { status: 500 }
      );
    }

    // Hash password using Bcrypt for secure database storage
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
      message: `Super Admin account (${superEmail}) has been successfully created/updated.`
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
