import prisma from '@/lib/prisma';
import AddTechnicianForm from '@/app/components/AddTechnicianForm';
import TechniciansTable from '@/app/components/TechniciansTable';
import { editTechnician, resetTechnicianPassword } from '@/app/actions/admin';
import { revalidatePath } from 'next/cache';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function TechniciansPage() {
  // Ambil daftar semua teknisi yang terdaftar
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    orderBy: { createdAt: 'desc' }
  });

  // Wrapper untuk edit teknisi dengan revalidate
  async function handleEditTechnician(formData: FormData) {
    'use server'
    await editTechnician(formData);
    revalidatePath('/admin/technicians');
  }

  // Wrapper untuk reset password dengan revalidate
  async function handleResetPassword(formData: FormData) {
    'use server'
    await resetTechnicianPassword(formData);
    revalidatePath('/admin/technicians');
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE (DARK MODE) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">👥</span> Manajemen Teknisi
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Daftarkan teknisi baru dan pantau daftar staf lapangan yang aktif.
          </p>
        </div>
        <div className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-xl text-sm font-bold border border-purple-500/20 shadow-sm flex items-center gap-2">
          {technicians.length} Staf Aktif
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: FORM TAMBAH TEKNISI */}
        <div className="lg:col-span-5 2xl:col-span-4">
          <div className="sticky top-28">
            <AddTechnicianForm />
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR TEKNISI (DARK MODE) */}
        <div className="lg:col-span-7 2xl:col-span-8 space-y-4">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4">
            <span className="bg-slate-800/50 p-1.5 rounded-lg text-sm border border-slate-700/50">📋</span> Daftar Karyawan Lapangan
          </h3>

          {technicians.length === 0 ? (
            <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-3xl p-12 text-center backdrop-blur-sm">
              <span className="text-5xl grayscale opacity-20">📭</span>
              <p className="text-slate-400 font-bold mt-4">Belum ada teknisi.</p>
              <p className="text-slate-500 text-sm mt-1">Silakan daftarkan teknisi pertama Anda di form sebelah kiri.</p>
            </div>
          ) : (
            <TechniciansTable 
              technicians={technicians}
              editTechnicianAction={handleEditTechnician}
              resetPasswordAction={handleResetPassword}
            />
          )}
        </div>

      </div>

    </div>
  );
}
