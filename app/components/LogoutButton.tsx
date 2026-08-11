'use client'

import { logoutUser } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {

  const handleLogout = async () => {
    await logoutUser(); 
    window.location.href = '/login'; 
  };

  return (
    <button 
      onClick={handleLogout} 
      className="text-xs md:text-sm bg-slate-800 text-slate-400 px-4 py-2 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 font-bold transition-all flex items-center gap-2 active:scale-95 border border-slate-700 hover:border-rose-500/30"
    >
      <LogOut className="w-4 h-4 hidden md:block" />
      Keluar
    </button>
  );

}
