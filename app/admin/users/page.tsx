import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import UsersTable from '@/app/components/UsersTable';
import { editUser, resetUserPassword, deleteUser } from '@/app/actions/user';

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

  // Server Action untuk menambah Admin/Super Admin
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
      if (existing) return;

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: { name, email, password: hashedPassword, role: role as any }
      });

      revalidatePath('/admin/users');
    } catch (error) {
      console.error('Gagal membuat user:', error);
    }
  }

  async function handleEditUser(formData: FormData) {
    'use server'
    const result = await editUser(formData);
    revalidatePath('/admin/users');
    return result;
  }

  async function handleResetPassword(formData: FormData) {
    'use server'
    const result = await resetUserPassword(formData);
    revalidatePath('/admin/users');
    return result;
  }

  async function handleDeleteUser(formData: FormData) {
    'use server'
    const result = await deleteUser(formData);
    revalidatePath('/admin/users');
    return result;
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
            editUserAction={handleEditUser}
            resetPasswordAction={handleResetPassword}
            deleteUserAction={handleDeleteUser}
            protectedEmails={PROTECTED_EMAILS}
          />
        </div>

      </div>
    </div>
  );
}
