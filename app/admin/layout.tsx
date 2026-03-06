import { getSession } from '@/lib/session';
import AdminClientLayout from './AdminClientLayout';

// Memastikan layout ini selalu mengambil cookie terbaru
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Baca cookie dengan aman langsung dari Server (menembus HttpOnly)
  const session = await getSession();
  const userRole = session?.userRole || 'ADMIN';

  // 2. Oper data role ke komponen Client pembungkus Sidebar
  return (
    <AdminClientLayout userRole={userRole}>
      {children}
    </AdminClientLayout>
  );
}