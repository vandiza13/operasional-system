'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAllCategories() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return {
      success: true,
      categories,
      total: categories.length
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      message: 'Gagal mengambil data kategori',
      error: String(error)
    };
  }
}

/**
 * Buat kategori baru
 */
export async function createCategory(formData: FormData) {
  try {
    const name = formData.get('name') as string;

    if (!name || name.trim() === '') {
      return { success: false, message: 'Nama kategori wajib diisi!' };
    }

    const trimmedName = name.trim();
    console.log('Creating category with name:', trimmedName);

    // Cek duplikat (case-insensitive manual untuk MySQL/TiDB compatibility)
    const allCategories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true }
    });
    
    const existing = allCategories.find(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase()
    );


    if (existing) {
      console.log('Duplicate category found:', existing);
      return { success: false, message: 'Kategori dengan nama tersebut sudah ada!' };
    }

    const newCategory = await prisma.expenseCategory.create({
      data: { name: trimmedName }
    });

    console.log('Category created successfully:', newCategory);

    revalidatePath('/admin/categories');
    revalidatePath('/submit');
    
    return { success: true, message: 'Kategori berhasil ditambahkan!' };
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Gagal membuat kategori: ${errorMessage}` };
  }
}


/**
 * Update kategori
 */
export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!id || !name || name.trim() === '') {
    return { success: false, message: 'Data tidak lengkap!' };
  }

  try {
    // Cek duplikat (case-insensitive manual untuk MySQL/TiDB compatibility)
    const allCategories = await prisma.expenseCategory.findMany({
      where: { id: { not: id } },
      select: { id: true, name: true }
    });
    
    const existing = allCategories.find(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase()
    );


    if (existing) {
      return { success: false, message: 'Kategori dengan nama tersebut sudah ada!' };
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { name: name.trim() }
    });

    revalidatePath('/admin/categories');
    revalidatePath('/submit');
    
    return { success: true, message: 'Kategori berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, message: 'Gagal mengupdate kategori' };
  }
}

/**
 * Toggle status aktif/nonaktif kategori
 */
export async function toggleCategoryStatus(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID kategori tidak valid!' };
  }

  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id }
    });

    if (!category) {
      return { success: false, message: 'Kategori tidak ditemukan!' };
    }

    await prisma.expenseCategory.update({
      where: { id },
      data: { isActive: !category.isActive }
    });

    revalidatePath('/admin/categories');
    revalidatePath('/submit');
    
    return { 
      success: true, 
      message: `Kategori ${category.isActive ? 'dinonaktifkan' : 'diaktifkan'}!` 
    };
  } catch (error) {
    console.error('Error toggling category:', error);
    return { success: false, message: 'Gagal mengubah status kategori' };
  }
}

/**
 * Hapus kategori (hanya jika tidak ada expense yang menggunakannya)
 */
export async function deleteCategory(formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID kategori tidak valid!' };
  }

  try {
    // Cek apakah kategori sedang digunakan
    const expensesUsingCategory = await prisma.expense.count({
      where: { categoryId: id }
    });

    if (expensesUsingCategory > 0) {
      return { 
        success: false, 
        message: `Kategori tidak bisa dihapus karena sedang digunakan oleh ${expensesUsingCategory} laporan!` 
      };
    }

    await prisma.expenseCategory.delete({
      where: { id }
    });

    revalidatePath('/admin/categories');
    revalidatePath('/submit');
    
    return { success: true, message: 'Kategori berhasil dihapus!' };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, message: 'Gagal menghapus kategori' };
  }
}
