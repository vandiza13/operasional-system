'use server'

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * GET /api/users - Ambil semua user dari database
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      users: users,
      total: users.length
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      message: 'Gagal mengambil data user',
      error: String(error)
    };
  }
}

/**
 * POST /api/users - Reset dan reseed database dengan test users
 */
export async function resetAndReseedUsers() {
  try {
    // Hapus semua data reimbursement terlebih dahulu (karena ada foreign key)
    await prisma.reimbursement.deleteMany({});
    
    // Hapus semua user
    await prisma.user.deleteMany({});

    // Buat test users dengan password yang di-hash
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedTechPassword = await bcrypt.hash('tech123', 10);

    await prisma.user.createMany({
      data: [
        {
          name: 'Admin Utama',
          email: 'admin@perusahaan.com',
          password: hashedAdminPassword,
          role: 'ADMIN'
        },
        {
          name: 'Teknisi Test 1',
          email: 'teknisi1@perusahaan.com',
          password: hashedTechPassword,
          role: 'TECHNICIAN'
        },
        {
          name: 'Teknisi Test 2',
          email: 'teknisi2@perusahaan.com',
          password: hashedTechPassword,
          role: 'TECHNICIAN'
        }
      ]
    });

    return {
      success: true,
      message: 'Database berhasil di-reset dan di-seed dengan test users!',
      testCredentials: {
        admin: { email: 'admin@perusahaan.com', password: 'admin123' },
        technician: { email: 'teknisi1@perusahaan.com', password: 'tech123' }
      }
    };
  } catch (error) {
    console.error('Error resetting database:', error);
    return {
      success: false,
      message: 'Gagal mereset database',
      error: String(error)
    };
  }
}
