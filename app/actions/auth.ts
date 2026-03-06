'use server'

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';

export async function loginUser(formData: FormData) {
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