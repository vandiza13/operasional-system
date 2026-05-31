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

    if (user.isLocked) {
      return { success: false, message: 'Akun Anda Terkunci. Silahkan hubungi Admin.', isLocked: true };
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return { success: false, message: 'Akun sementara dikunci.', lockUntil: user.lockUntil.toISOString(), isLocked: false };
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockUntil = null;
      let isLocked = false;

      if (failedAttempts === 3) {
        lockUntil = new Date(Date.now() + 3 * 60 * 1000); // 3 menit
      } else if (failedAttempts === 4) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 menit
      } else if (failedAttempts >= 5) {
        isLocked = true;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failedAttempts, lockUntil, isLocked }
      });

      if (isLocked) {
        return { success: false, message: 'Akun Anda Terkunci. Silahkan hubungi Admin.', isLocked: true };
      }
      if (lockUntil) {
        return { success: false, message: 'Terlalu banyak percobaan. Akun sementara dikunci.', lockUntil: lockUntil.toISOString(), isLocked: false };
      }

      return { success: false, message: `Email atau password salah! (${failedAttempts}/3 percobaan pertama)` };
    }

    // Reset attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil || user.isLocked) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockUntil: null, isLocked: false }
      });
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
