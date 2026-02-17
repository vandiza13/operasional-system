'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Protected accounts that cannot be deleted - loaded from environment variables
const PROTECTED_EMAILS = process.env.PROTECTED_ADMIN_EMAILS?.split(',') || [];


/**
 * GET /api/users - Get all users from database
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
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
      message: 'Failed to fetch user data',
      error: String(error)
    };
  }
}

/**
 * POST /api/users - Reset and reseed database with test users
 * 
 * SECURITY NOTE: This function should only be used in development.
 * In production, users should be created through a secure admin interface.
 */
export async function resetAndReseedUsers() {
  try {
    // Get credentials from environment variables
    const superAdminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const techEmail = process.env.SEED_TECH_EMAIL || 'technician@example.com';
    const techPassword = process.env.SEED_TECH_PASSWORD;

    // Validate that passwords are set
    if (!superAdminPassword || !adminPassword || !techPassword) {
      return {
        success: false,
        message: 'Seed passwords not configured. Please set SEED_*_PASSWORD environment variables.',
        error: 'Missing environment variables'
      };
    }

    // Delete all users
    await prisma.user.deleteMany({});

    // Create test users with hashed passwords from environment variables
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashedTechPassword = await bcrypt.hash(techPassword, 10);

    // Create Super Admin
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedSuperAdminPassword,
        role: 'SUPER_ADMIN' as any
      }
    });
    
    // Create Admin
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'ADMIN' as any
      }
    });
    
    // Create Technician with additional fields
    await prisma.user.create({
      data: {
        name: 'Teknisi Satu',
        email: techEmail,
        password: hashedTechPassword,
        role: 'TECHNICIAN' as any,
        nik: '1234567890',
        phone: '081234567890',
        position: 'Teknisi Senior'
      }
    });

    // SECURITY: Never return actual passwords in API responses
    return {
      success: true,
      message: 'Database successfully reset and seeded with test users!',
      // Only return email hints, never passwords
      usersCreated: {
        superadmin: { email: superAdminEmail, role: 'SUPER_ADMIN' },
        admin: { email: adminEmail, role: 'ADMIN' },
        technician: { email: techEmail, role: 'TECHNICIAN' }
      }
    };
  } catch (error) {
    console.error('Error resetting users:', error);
    return {
      success: false,
      message: 'Failed to reset database',
      error: String(error)
    };
  }
}


/**
 * Get current user profile from cookie
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        nik: true,
        phone: true,
        position: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }
}

/**
 * Edit user data
 */
export async function editUser(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  if (!id || !name || !email || !role) {
    return { success: false, message: 'Incomplete data!' };
  }

  try {
    // Check for duplicate email (excluding current user)
    const existing = await prisma.user.findFirst({
      where: {
        email: email,
        id: { not: id }
      }
    });

    if (existing) {
      return { success: false, message: 'Email is already in use by another user!' };
    }

    await prisma.user.update({
      where: { id },
      data: { name, email, role: role as any }
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'User updated successfully!' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Failed to update user' };
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(formData: FormData) {
  const id = formData.get('id') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!id || !newPassword) {
    return { success: false, message: 'Incomplete data!' };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'Password reset successfully!' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'Failed to reset password' };
  }
}

/**
 * Delete user (protected accounts cannot be deleted)
 */
export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'User ID is required!' };
  }

  try {
    // Get user to check if it's a protected account
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true }
    });

    if (!user) {
      return { success: false, message: 'User not found!' };
    }

    // Check if this is a protected account
    if (PROTECTED_EMAILS.includes(user.email)) {
      return { 
        success: false, 
        message: `Cannot delete protected account: ${user.email}. This account is locked for system security.` 
      };
    }

    // Check if user has expenses
    const expensesCount = await prisma.expense.count({
      where: { userId: id }
    });



    if (expensesCount > 0) {
      return { 
        success: false, 
        message: `Cannot delete user. User has ${expensesCount} expense reports. Please reassign or delete these reports first.` 
      };
    }

    await prisma.user.delete({
      where: { id }
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'User deleted successfully!' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
}
