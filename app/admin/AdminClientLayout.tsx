'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

export default function AdminClientLayout({ 
  children, 
  userRole 
}: { 
  children: React.ReactNode, 
  userRole: string 
}) {
  const pathname = usePathname();

  // Menu Standar (Untuk ADMIN & SUPER_ADMIN)
  const baseMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Approval Bon', path: '/admin/approval', icon: '⏳' },
    { name: 'Antrean Cair', path: '/admin/queue', icon: '🏦' },
    { name: 'Staf Lapangan', path: '/admin/technicians', icon: '👨‍🔧' },
  ];

  // Menu Khusus (Hanya untuk SUPER_ADMIN)
  const superAdminMenuItems = [
    { name: 'Manajemen User', path: '/admin/users', icon: '👑' },
    { name: 'Kategori Biaya', path: '/admin/categories', icon: '📁' },
  ];

  // Gabungkan menu jika rolenya SUPER_ADMIN
  const menuItems = userRole === 'SUPER_ADMIN' 
    ? [...baseMenuItems, ...superAdminMenuItems] 
    : baseMenuItems;

  return (
    // DARK THEME: Latar belakang utama menggunakan slate-900
    <div className="min-h-screen bg-slate-900 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* SIDEBAR (Desktop) - DARK THEME */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950 border-r border-slate-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20 sticky top-0 h-screen">
        
        {/* LOGO AREA */}
        <div className="p-6 border-b border-slate-800/60 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-lg ${userRole === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-rose-500 to-orange-600 shadow-rose-900/50' : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-900/50'}`}>
            <span className="text-xl text-white leading-none">{userRole === 'SUPER_ADMIN' ? '👑' : '👨‍💻'}</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-none">
              {userRole === 'SUPER_ADMIN' ? 'Super' : 'Admin'}<span className={userRole === 'SUPER_ADMIN' ? 'text-rose-500' : 'text-indigo-400'}>Panel</span>
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Sistem Operasional</p>
          </div>
        </div>

        {/* NAVIGATION AREA */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 mt-2">Menu Utama</p>
          
          {baseMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
                  isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 shadow-sm border border-indigo-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-indigo-300 border border-transparent'
                }`}>
                  <span className={`text-xl ${!isActive && 'grayscale opacity-70'}`}>{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}

          {/* Render Menu Tambahan jika Super Admin */}
          {userRole === 'SUPER_ADMIN' && (
            <>
              <div className="h-px bg-slate-800/60 my-5 mx-2"></div>
              <p className="px-3 text-[10px] font-black text-rose-500/80 uppercase tracking-widest mb-3">Super Admin Zone</p>
              {superAdminMenuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-200 ${
                      isActive 
                      ? 'bg-rose-500/10 text-rose-400 shadow-sm border border-rose-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-rose-300 border border-transparent'
                    }`}>
                      <span className={`text-xl ${!isActive && 'grayscale opacity-70'}`}>{item.icon}</span>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* LOGOUT AREA */}
        <div className="p-4 border-t border-slate-800/60">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER MOBILE - DARK THEME */}
        <header className="md:hidden bg-slate-950 border-b border-slate-800/60 sticky top-0 z-30 p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{userRole === 'SUPER_ADMIN' ? '👑' : '👨‍💻'}</span>
            <h1 className="font-black text-white text-lg">
              {userRole === 'SUPER_ADMIN' ? 'Super' : 'Admin'}<span className={userRole === 'SUPER_ADMIN' ? 'text-rose-500' : 'text-indigo-400'}>Panel</span>
            </h1>
          </div>
          <LogoutButton />
        </header>

        {/* BOTTOM NAVIGATION MOBILE - DARK THEME */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800/60 z-30 flex justify-around items-center p-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.5)] overflow-x-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const isSuperMenu = superAdminMenuItems.some(m => m.path === item.path);
            
            return (
              <Link key={item.path} href={item.path} className="flex-shrink-0 min-w-[72px]">
                <div className="flex flex-col items-center justify-center py-2">
                  <span className={`text-xl mb-1 ${!isActive && 'grayscale opacity-50'}`}>{item.icon}</span>
                  <span className={`text-[9px] font-bold ${
                    isActive 
                      ? (isSuperMenu ? 'text-rose-400' : 'text-indigo-400') 
                      : 'text-slate-500'
                  }`}>
                    {item.name.split(' ')[0]}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-8 overflow-x-hidden text-slate-300">
          {children}
        </main>
      </div>
    </div>
  );
}