import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // AUTH CHECK: Hanya SUPER_ADMIN, atau izinkan jika database kosong (initial setup)
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const totalUsers = await prisma.user.count();

    // Izinkan tanpa auth HANYA jika database kosong (initial setup)
    if (totalUsers > 0) {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: 'Forbidden: Super Admin only' }, { status: 403 });
      }
    }

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

    // Gunakan UPSERT (Update or Insert)
    await prisma.user.upsert({
      where: { email: superEmail },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        name: 'Super Admin Vandiza'
      },
      create: {
        name: 'Super Admin Vandiza',
        email: superEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
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
