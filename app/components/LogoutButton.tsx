'use client'

import { logoutUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser(); // Hapus KTP (Cookie)
    router.push('/login'); // Lempar ke halaman login
  };

  return (
    <button 
      onClick={handleLogout} 
      className="text-sm bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 font-bold transition-colors"
    >
      Keluar (Logout)
    </button>
  );
}