import { getVerifiedSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminClientLayout from './AdminClientLayout';

// Memastikan layout ini selalu mengambil cookie terbaru
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Baca session terverifikasi real-time dari database
  const session = await getVerifiedSession();

  if (!session) {
    redirect('/login');
  }

  // 2. Cegah akses Teknisi ke modul Admin
  if (session.userRole !== 'ADMIN' && session.userRole !== 'SUPER_ADMIN') {
    redirect('/submit');
  }

  // 3. Oper data role & nama ke komponen Client pembungkus Sidebar
  return (
    <AdminClientLayout userRole={session.userRole} userName={session.userName}>
      {children}
    </AdminClientLayout>
  );
}