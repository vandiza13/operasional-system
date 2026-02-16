'use client'

import { logoutUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser(); 
    router.push('/login'); 
  };

  return (
    <button 
      onClick={handleLogout} 
      className="text-xs md:text-sm bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-rose-100 hover:text-rose-600 font-bold transition-all flex items-center gap-2 active:scale-95"
    >
      <svg className="w-4 h-4 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
      </svg>
      Keluar
    </button>
  );
}