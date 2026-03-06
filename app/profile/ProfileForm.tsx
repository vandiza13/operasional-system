'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ProfileForm({
    user,
    updateProfileAction,
    updatePasswordAction
}: {
    user: any,
    updateProfileAction: (formData: FormData) => Promise<any>,
    updatePasswordAction: (formData: FormData) => Promise<any>
}) {
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Form Profil
    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingProfile(true);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await updateProfileAction(formData);

            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Gagal memperbarui profil.');
        } finally {
            setLoadingProfile(false);
        }
    };

    // Form Password
    const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoadingPassword(true);

        try {
            const formData = new FormData(e.currentTarget);

            // Client-side quick validation
            const newPwd = formData.get('newPassword') as string;
            const confirmPwd = formData.get('confirmPassword') as string;

            if (newPwd !== confirmPwd) {
                toast.error('Gagal: Password baru dan konfirmasi tidak cocok.');
                setLoadingPassword(false);
                return;
            }
            if (newPwd.length < 6) {
                toast.error('Gagal: Password baru minimal 6 karakter.');
                setLoadingPassword(false);
                return;
            }

            const result = await updatePasswordAction(formData);

            if (result.success) {
                toast.success(result.message);
                (e.target as HTMLFormElement).reset(); // Kosongkan form password setelah sukses
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Gagal mereset password.');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* KARTU 1: DATA PROFIL UMUM */}
            <div className="bg-slate-800/50 rounded-[2rem] p-6 sm:p-8 shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl border border-indigo-500/20 shadow-inner">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Data Profil</h3>
                        <p className="text-sm text-slate-400 font-medium">Informasi dasar akun Anda.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Nama Lengkap</label>
                        <input
                            type="text" name="name" defaultValue={user.name} required
                            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Email Pendaftaran</label>
                        <input
                            type="email" name="email" defaultValue={user.email} required
                            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all"
                        />
                    </div>

                    {user.role === 'TECHNICIAN' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Jabatan / Posisi</label>
                                <input
                                    type="text" name="position" defaultValue={user.position || ''}
                                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">NIK Karyawan</label>
                                    <input
                                        type="text" name="nik" defaultValue={user.nik || ''}
                                        className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">No. WhatsApp</label>
                                    <input
                                        type="text" name="phone" defaultValue={user.phone || ''}
                                        className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-medium outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 mt-8 border-t border-slate-700/50">
                        <button
                            type="submit" disabled={loadingProfile}
                            className={`w-full py-3.5 px-6 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2
                ${loadingProfile
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/30'
                                }`}
                        >
                            {loadingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>


            {/* KARTU 2: GANTI PASSWORD */}
            <div className="bg-slate-800/50 rounded-[2rem] p-6 sm:p-8 shadow-lg border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl border border-amber-500/20 shadow-inner">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Ganti Password</h3>
                        <p className="text-sm text-slate-400 font-medium">Bantu jaga keamanan akun Anda.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5 relative z-10">
                    <div className="space-y-1.5 relative">
                        <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Password Saat Ini</label>
                        <input
                            type="password" name="currentPassword" required placeholder="Masukkan password lama"
                            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-medium outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1.5 relative mt-8 pt-6 border-t border-slate-700/50">
                        <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Password Baru</label>
                        <input
                            type="password" name="newPassword" required placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-medium outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1.5 relative">
                        <label className="block text-xs font-bold text-slate-400 ml-1 uppercase tracking-widest">Konfirmasi Password Baru</label>
                        <input
                            type="password" name="confirmPassword" required placeholder="Ketik ulang password baru"
                            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700/50 rounded-xl focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white font-medium outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="pt-4 mt-8 border-t border-slate-700/50">
                        <button
                            type="submit" disabled={loadingPassword}
                            className={`w-full py-3.5 px-6 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2
                ${loadingPassword
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            {loadingPassword ? 'Memproses...' : 'Ubah Password'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}
