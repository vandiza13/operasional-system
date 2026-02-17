'use client';

import { useState } from 'react';
import EditUserModal from './EditUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

export default function UsersTable({ 
  users, 
  editUserAction, 
  resetPasswordAction, 
  deleteUserAction,
  protectedEmails = []
}: { 
  users: User[];
  editUserAction: (formData: FormData) => Promise<{success: boolean; message?: string}>;
  resetPasswordAction: (formData: FormData) => Promise<{success: boolean; message?: string}>;
  deleteUserAction: (formData: FormData) => Promise<{success: boolean; message?: string}>;
  protectedEmails?: string[];
}) {

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleEdit = async (formData: FormData) => {
    setLoading(`edit-${formData.get('id')}`);
    try {
      const result = await editUserAction(formData);
      if (result.success) {
        setEditingUser(null);
      } else {
        alert(result.message || 'Failed to update user');
      }
    } catch (error) {
      alert('Failed to update user');
    } finally {
      setLoading(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    // Generate a secure random password
    const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    
    if (!confirm(`Reset password to "${randomPassword}"?`)) return;
    
    setLoading(`reset-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('newPassword', randomPassword);
      const result = await resetPasswordAction(formData);
      if (result.success) {
        alert(`Password reset successfully to: ${randomPassword}\n\nPlease copy this password and share it securely with the user.`);
      } else {
        alert(result.message || 'Failed to reset password');
      }
    } catch (error) {
      alert('Failed to reset password');
    } finally {
      setLoading(null);
    }
  };


  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    
    setLoading(`delete-${id}`);
    try {
      const formData = new FormData();
      formData.append('id', id);
      const result = await deleteUserAction(formData);
      if (result.success) {
        // Success - page will revalidate
      } else {
        alert(result.message || 'Failed to delete user');
      }
    } catch (error) {
      alert('Failed to delete user');
    } finally {
      setLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-rose-500/20">👑 Super Admin</span>;
      case 'ADMIN':
        return <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-500/20">👨‍💻 Admin</span>;
      case 'TECHNICIAN':
        return <span className="bg-slate-700/50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-600/50">👷‍♂️ Technician</span>;
      default:
        return <span className="bg-slate-700/50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-600/50">{role}</span>;
    }
  };

  // Check if user is protected
  const isProtectedUser = (email: string) => {
    return protectedEmails.includes(email);
  };


  return (
    <div className="bg-slate-800/50 rounded-3xl shadow-lg border border-slate-700/50 overflow-hidden relative backdrop-blur-sm">
      <div className="overflow-x-auto p-2">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-700/50">
              <th className="p-4 pl-6">User</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-16 text-center">
                  <div className="text-5xl mb-4 grayscale opacity-20">📭</div>
                  <p className="text-slate-400 font-bold text-lg">No users found</p>
                  <p className="text-slate-500 text-sm mt-1">Add your first user using the form on the left.</p>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/80 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-white text-sm">{u.name}</p>
                      {isProtectedUser(u.email) && (
                        <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20" title="Protected account">
                          🔒
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{u.email}</p>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingUser(u)}
                        disabled={loading !== null}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all disabled:opacity-50"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleResetPassword(u.id)}
                        disabled={loading !== null}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all disabled:opacity-50"
                      >
                        🔑 Reset
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={loading !== null || isProtectedUser(u.email)}
                        title={isProtectedUser(u.email) ? 'Protected account cannot be deleted' : 'Delete user'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 ${
                          isProtectedUser(u.email) 
                            ? 'bg-slate-700/30 text-slate-500 border border-slate-600/30 cursor-not-allowed' 
                            : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                        }`}
                      >
                        {isProtectedUser(u.email) ? '🔒 Locked' : '🗑️ Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
