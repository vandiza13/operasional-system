'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Approve expense report
export async function approveReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  const newAmount = formData.get('amount') as string;
  
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('userId')?.value;

    await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminId,
        amount: newAmount ? parseFloat(newAmount) : undefined,
      }
    });
    revalidatePath('/admin');
    return { success: true, message: 'Expense approved successfully' };
  } catch (error) {
    console.error('Failed to approve:', error);
    return { success: false, message: 'Failed to approve expense' };
  }
}


// Mark expense as paid
export async function payReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  
  try {
    await prisma.expense.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      }
    });
    revalidatePath('/admin');
    return { success: true, message: 'Expense marked as paid' };
  } catch (error) {
    console.error('Failed to mark as paid:', error);
    return { success: false, message: 'Failed to mark as paid' };
  }
}


// Reject expense report
export async function rejectReimbursement(formData: FormData) {
  const id = formData.get('id') as string;
  const reason = formData.get('reason') as string;
  
  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return { success: false, message: 'Expense not found' };
    }

    const currentDesc = expense.description || '';
    const newDescription = reason 
      ? `${currentDesc}\n\nREJECTED: ${reason}`.trim()
      : currentDesc;

    await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: newDescription
      }
    });
    revalidatePath('/admin');
    return { success: true, message: 'Expense rejected successfully' };
  } catch (error) {
    console.error('Failed to reject:', error);
    return { success: false, message: 'Failed to reject expense' };
  }
}



export async function createTechnician(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nik = formData.get('nik') as string;
  const phone = formData.get('phone') as string;
  const position = formData.get('position') as string;

  if (!name || !email || !password) {
    return { success: false, message: 'Name, email, and password are required' };
  }

  try {
    // Check email duplicate
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: 'Email already registered in the system' };
    }

    // Check NIK duplicate
    if (nik) {
      const existingNik = await prisma.user.findUnique({ where: { nik } });
      if (existingNik) {
        return { success: false, message: 'Employee NIK already registered' };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: 'TECHNICIAN',
        nik: nik || null,
        phone: phone || null,
        position: position || null
      }
    });

    revalidatePath('/admin/technicians'); 
    return { success: true, message: `Technician ${name} account created successfully` };

  } catch (error) {
    console.error('Failed to create technician:', error);
    return { success: false, message: 'System error while creating account' };
  }
}


/**
 * Edit technician data
 */
export async function editTechnician(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const nik = formData.get('nik') as string;
  const phone = formData.get('phone') as string;
  const position = formData.get('position') as string;

  if (!id || !name || !email) {
    return { success: false, message: 'Incomplete data' };
  }

  try {
    // Check email duplicate (excluding self)
    const existing = await prisma.user.findFirst({
      where: { 
        email: email,
        id: { not: id }
      }
    });

    if (existing) {
      return { success: false, message: 'Email already used by another user' };
    }

    // Check NIK duplicate (excluding self)
    if (nik) {
      const existingNik = await prisma.user.findFirst({
        where: { 
          nik: nik,
          id: { not: id }
        }
      });
      if (existingNik) {
        return { success: false, message: 'NIK already registered by another user' };
      }
    }

    await prisma.user.update({
      where: { id },
      data: { 
        name, 
        email, 
        nik: nik || null, 
        phone: phone || null, 
        position: position || null 
      }
    });

    revalidatePath('/admin/technicians');
    return { success: true, message: 'Technician data updated successfully' };
  } catch (error) {
    console.error('Error updating technician:', error);
    return { success: false, message: 'Failed to update technician' };
  }
}


/**
 * Reset technician password
 */
export async function resetTechnicianPassword(formData: FormData) {
  const id = formData.get('id') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!id || !newPassword || newPassword.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters' };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    revalidatePath('/admin/technicians');
    return { success: true, message: 'Technician password reset successfully' };
  } catch (error) {
    console.error('Error resetting technician password:', error);
    return { success: false, message: 'Failed to reset technician password' };
  }
}
