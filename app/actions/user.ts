'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Protected accounts that cannot be deleted
const PROTECTED_EMAILS = ['superadmin@vandiza.com', 'admin@vandiza.com'];

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
 */
export async function resetAndReseedUsers() {
  try {
    // Delete all users
    await prisma.user.deleteMany({});

    // Create test users with hashed passwords
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedTechPassword = await bcrypt.hash('tech123', 10);

    // Create Super Admin
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@vandiza.com',
        password: await bcrypt.hash('superadmin123', 10),
        role: 'SUPER_ADMIN' as any
      }
    });
    
    // Create Admin
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@vandiza.com',
        password: hashedAdminPassword,
        role: 'ADMIN' as any
      }
    });
    
    // Create Technician with additional fields
    await prisma.user.create({
      data: {
        name: 'Teknisi Satu',
        email: 'teknisi1@vandiza.com',
        password: hashedTechPassword,
        role: 'TECHNICIAN' as any,
        nik: '1234567890',
        phone: '081234567890',
        position: 'Teknisi Senior'
      }
    });


    return {
      success: true,
      message: 'Database successfully reset and seeded with test users!',
      testCredentials: {
        superadmin: { email: 'superadmin@vandiza.com', password: 'superadmin123' },
        admin: { email: 'admin@vandiza.com', password: 'admin123' },
        technician: { email: 'teknisi1@vandiza.com', password: 'tech123' }
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
