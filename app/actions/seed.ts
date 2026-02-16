'use server'

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * 🌱 Seed Function - Create test users for development
 * Uses bcrypt for password hashing (same as auth.ts)
 */
export async function seedTestUsers() {
  try {
    // 1. Check if users already exist
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      return { 
        success: true, 
        message: `Database sudah memiliki ${existingUsers} user. Skip seeding.` 
      };
    }

    // Hash passwords with bcrypt (10 salt rounds = standard secure & fast)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const techPassword = await bcrypt.hash('pass123', 10);

    // 2. Create ADMIN user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin Operasional',
        email: 'admin@operational.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });

    // 3. Create TECHNICIAN users
    const tech1 = await prisma.user.create({
      data: {
        name: 'Teknisi Budi',
        email: 'budi@teknisi.com',
        password: techPassword,
        role: 'TECHNICIAN'
      }
    });

    const tech2 = await prisma.user.create({
      data: {
        name: 'Teknisi Rina',
        email: 'rina@teknisi.com',
        password: techPassword,
        role: 'TECHNICIAN'
      }
    });

    const tech3 = await prisma.user.create({
      data: {
        name: 'Teknisi Ahmad',
        email: 'ahmad@teknisi.com',
        password: techPassword,
        role: 'TECHNICIAN'
      }
    });

    return {
      success: true,
      message: '✅ Test users created successfully!',
      users: [
        { name: admin.name, email: admin.email, role: admin.role },
        { name: tech1.name, email: tech1.email, role: tech1.role },
        { name: tech2.name, email: tech2.email, role: tech2.role },
        { name: tech3.name, email: tech3.email, role: tech3.role }
      ]
    };

  } catch (error) {
    console.error('Seeding error:', error);
    return { 
      success: false, 
      message: 'Gagal membuat test users. Pastikan database sudah terhubung.' 
    };
  }
}
