import prisma from '@/lib/prisma';
import { approveReimbursement, rejectReimbursement } from '@/app/actions/admin';
import { revalidatePath } from 'next/cache';
import ApprovalTable from '@/app/components/ApprovalTable';

// WAJIB: Agar Next.js selalu menarik data terbaru (tidak di-cache)
export const dynamic = 'force-dynamic';

export default async function ApprovalPage() {
  // Ambil data laporan yang PENDING
  const pendingList = await prisma.expense.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: { user: true, attachments: true }, 
  });

  // Wrapper untuk approve dengan revalidate
  async function handleApprove(formData: FormData) {
    'use server'
    await approveReimbursement(formData);
    revalidatePath('/admin/approval');
  }

  // Wrapper untuk reject dengan revalidate
  async function handleReject(formData: FormData) {
    'use server'
    await rejectReimbursement(formData);
    revalidatePath('/admin/approval');
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER PAGE (DARK MODE) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-3xl">⏳</span> Expense Verification
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Check receipt photos and adjust amount before approving or rejecting.
          </p>
        </div>
        <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/20 shadow-sm flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          {pendingList.length} Pending
        </div>
      </div>


      {/* Approval Table */}
      <ApprovalTable 
        expenses={pendingList}
        approveAction={handleApprove}
        rejectAction={handleReject}
      />
    </div>
  );
}
