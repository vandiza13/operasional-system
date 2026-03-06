import { getCurrentUser } from '@/app/actions/user';
import { updateMyProfile, updateMyPassword } from '@/app/actions/profile';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    // Tentukan rute "Kembali" berdasarkan role
    const backRoute = (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? '/admin' : '/submit';

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 pb-12">

            {/* HEADER KHUSUS PROFIL */}
            <header className="bg-slate-950 sticky top-0 z-20 border-b border-slate-800/60 shadow-lg px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-900/50">
                        <span className="text-xl leading-none">👤</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">Profil <span className="text-indigo-400">Saya</span></h1>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Pengaturan Akun</p>
                    </div>
                </div>

                <Link href={backRoute}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all border border-slate-700/50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        <span className="hidden sm:inline">Kembali</span>
                    </button>
                </Link>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-6 md:py-8 flex justify-center w-full">
                <div className="w-full max-w-3xl space-y-8">

                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white tracking-tight">Pengaturan Akun</h2>
                        <p className="text-slate-400 font-medium mt-2">Kelola informasi profil dan keamanan akun Anda di sini.</p>
                    </div>

                    <ProfileForm user={user} updateProfileAction={updateMyProfile} updatePasswordAction={updateMyPassword} />

                </div>
            </main>

        </div>
    );
}
