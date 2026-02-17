import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import UsersTable from '@/app/components/UsersTable';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function UsersManagementPage() {
  // Protected accounts that cannot be deleted - loaded from environment variables
  const PROTECTED_EMAILS = process.env.PROTECTED_ADMIN_EMAILS?.split(',') || [];

  // Ambil semua user, urutkan berdasarkan Role (Super Admin paling atas)
  const users = await prisma.user.findMany({
    orderBy: [
      { role: 'desc' }, 
      { createdAt: 'desc' }
    ]
  });


  // Server Action untuk menambah Admin/Super Admin (Langsung di dalam komponen Server)
  async function addSystemUser(formData: FormData) {
    'use server'
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!name || !email || !password || !role) return;

    try {
      // Cek email ganda
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return; // Mengabaikan jika email sudah ada (bisa dikembangkan pakai toast nanti)

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await prisma.user.create({
        data: { name, email, password: hashedPassword, role: role as any }
      });
      
      revalidatePath('/admin/users');
    } catch (error) {
      console.error('Gagal membuat user:', error);
    }
  }

  // Server Action untuk edit user
  async function editUser(formData: FormData) {
    'use server'
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

  // Server Action untuk reset password
  async function resetUserPassword(formData: FormData) {
    'use server'
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

  // Server Action untuk delete user
  async function deleteUser(formData: FormData) {
    'use server'
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
      const expensesCount = await prisma.Expense.count({
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

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE (DARK MODE - VIP THEME) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">👑</span> User Access Management
          </h2>
          <p className="text-sm text-rose-400/80 font-medium mt-1">
            Super Admin Only Area. Manage Admin registration and Access Rights.
          </p>
        </div>
        <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl text-sm font-bold border border-rose-500/20 shadow-sm flex items-center gap-2">
          {users.length} Total Users
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM TAMBAH ADMIN */}
        <div className="lg:col-span-5 2xl:col-span-4">
          <div className="bg-slate-800/50 p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm sticky top-28">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-orange-600"></div>
            
            <h2 className="text-xl font-extrabold text-white mb-1 flex items-center">
              <span className="bg-rose-500/20 text-rose-400 p-2 rounded-xl mr-3 shadow-sm border border-rose-500/20">➕</span> Add System User
            </h2>
            <p className="text-sm text-slate-400 mb-6 font-medium">Register new Admin or Super Admin.</p>

            <form action={addSystemUser} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 ml-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 ml-1">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  placeholder="admin@company.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 ml-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 ml-1">Access Level (Role)</label>
                <select name="role" required className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:bg-slate-950 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white text-sm outline-none transition-all">
                  <option value="ADMIN">Main Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-rose-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2"
              >
                Create User Account
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR SEMUA USER */}
        <div className="lg:col-span-7 2xl:col-span-8 space-y-4">
          <UsersTable 
            users={users} 
            editUserAction={editUser}
            resetPasswordAction={resetUserPassword}
            deleteUserAction={deleteUser}
            protectedEmails={PROTECTED_EMAILS}
          />
        </div>


      </div>
    </div>
  );
}
