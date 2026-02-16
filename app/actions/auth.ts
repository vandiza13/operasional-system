'use server'

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    // 1. Cari user berdasarkan email di TiDB
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    // 2. Cek apakah user ada dan passwordnya cocok 
    // (Catatan: Untuk versi production nanti password harus di-hash bcrypt, tapi untuk sekarang kita pakai plain text agar mudah dites)
    if (!user || user.password !== password) {
      return { success: false, message: 'Email atau password salah!' };
    }

    // 3. Jika cocok, buat "KTP Sementara" (Session) menggunakan Cookies bawaan Next.js
    // Cookie ini akan disimpan di browser HP teknisi
    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { httpOnly: true, path: '/' });
    cookieStore.set('userName', user.name, { httpOnly: true, path: '/' });
    cookieStore.set('userRole', user.role, { httpOnly: true, path: '/' });

    return { 
      success: true, 
      role: user.role,
      message: 'Login berhasil!' 
    };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Terjadi kesalahan sistem.' };
  }
}

export async function logoutUser() {
  // Menghapus cookie saat user klik Logout
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  cookieStore.delete('userName');
  cookieStore.delete('userRole');
}