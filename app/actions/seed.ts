'use server'

import prisma from '@/lib/prisma';

/**
 * 🌱 Seed Function - Create test users for development
 * Run this ONCE to populate the database with test accounts
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

    // 2. Create ADMIN user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin Operasional',
        email: 'admin@operational.com',
        password: 'admin123', // ⚠️ Plain text untuk development
        role: 'ADMIN'
      }
    });

    // 3. Create TECHNICIAN users
    const tech1 = await prisma.user.create({
      data: {
        name: 'Teknisi Budi',
        email: 'budi@teknisi.com',
        password: 'pass123', // ⚠️ Plain text untuk development
        role: 'TECHNICIAN'
      }
    });

    const tech2 = await prisma.user.create({
      data: {
        name: 'Teknisi Rina',
        email: 'rina@teknisi.com',
        password: 'pass123', // ⚠️ Plain text untuk development
        role: 'TECHNICIAN'
      }
    });

    const tech3 = await prisma.user.create({
      data: {
        name: 'Teknisi Ahmad',
        email: 'ahmad@teknisi.com',
        password: 'pass123', // ⚠️ Plain text untuk development
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
