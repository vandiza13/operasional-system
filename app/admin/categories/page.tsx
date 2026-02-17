import prisma from '@/lib/prisma';
import { createCategory, updateCategory, toggleCategoryStatus, deleteCategory } from '@/app/actions/categories';
import { revalidatePath } from 'next/cache';
import CategoriesTable from '@/app/components/CategoriesTable';
import CreateCategoryForm from '@/app/components/CreateCategoryForm';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Wrapper untuk create category dengan revalidate
  async function handleCreateCategory(formData: FormData) {
    'use server'
    const result = await createCategory(formData);
    if (!result.success) {
      throw new Error(result.message);
    }
    revalidatePath('/admin/categories');
  }

  // Wrapper untuk update category dengan revalidate
  async function handleUpdateCategory(formData: FormData) {
    'use server'
    const result = await updateCategory(formData);
    if (!result.success) {
      throw new Error(result.message);
    }
    revalidatePath('/admin/categories');
  }

  // Wrapper untuk toggle status dengan revalidate
  async function handleToggleStatus(formData: FormData) {
    'use server'
    const result = await toggleCategoryStatus(formData);
    if (!result.success) {
      throw new Error(result.message);
    }
    revalidatePath('/admin/categories');
  }

  // Wrapper untuk delete category dengan revalidate
  async function handleDeleteCategory(formData: FormData) {
    'use server'
    const result = await deleteCategory(formData);
    if (!result.success) {
      throw new Error(result.message);
    }
    revalidatePath('/admin/categories');
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">📁</span> Manajemen Kategori
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Kelola kategori pengeluaran untuk sistem reimbursement.
          </p>
        </div>
        <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-500/20 shadow-sm flex items-center gap-2">
          {categories.length} Kategori
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM TAMBAH KATEGORI */}
        <div className="lg:col-span-5 2xl:col-span-4">
          <CreateCategoryForm createAction={handleCreateCategory} />
        </div>

        {/* KOLOM KANAN: DAFTAR KATEGORI */}
        <div className="lg:col-span-7 2xl:col-span-8 space-y-4">
          <CategoriesTable 
            categories={categories}
            updateCategoryAction={handleUpdateCategory}
            toggleStatusAction={handleToggleStatus}
            deleteCategoryAction={handleDeleteCategory}
          />
        </div>

      </div>
    </div>
  );
}
