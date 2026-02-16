'use server'

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs'; // Import Bcrypt

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // Jika email tidak ditemukan
    if (!user) {
      return { success: false, message: 'Email atau password salah!' };
    }

    // PENCOCOKAN PASSWORD DENGAN BCRYPT
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return { success: false, message: 'Email atau password salah!' };
    }

    // Store session in cookies
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { httpOnly: true, path: '/' });
    cookieStore.set('userName', user.name, { httpOnly: true, path: '/' });
    cookieStore.set('userRole', user.role, { httpOnly: true, path: '/' });

    return { success: true, role: user.role, message: 'Login berhasil!' };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  cookieStore.delete('userName');
  cookieStore.delete('userRole');
}