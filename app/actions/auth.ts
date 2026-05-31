'use server'

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';
import { headers } from 'next/headers';
import { checkLoginRateLimit } from '@/lib/rate-limit';

export async function loginUser(formData: FormData) {
  // Pengecekan Rate Limit
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
  
  const rateLimit = await checkLoginRateLimit(ip);
  if (!rateLimit.success) {
    return { success: false, message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 5 menit.' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      return { success: false, message: 'Email atau password salah!' };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return { success: false, message: 'Email atau password salah!' };
    }

    // Create secure session
    await createSession(user.id, user.name, user.role);

    return { success: true, role: user.role, message: 'Login berhasil!' };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

export async function logoutUser() {
  await deleteSession();
}
