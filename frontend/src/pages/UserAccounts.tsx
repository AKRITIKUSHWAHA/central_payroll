import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { UserAccount, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import { UserCog, UserPlus, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const UserAccounts: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(() => userService.getUsers());
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    userService.fetchUsers().then(fetched => {
      setUsers([...fetched]);
    });
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    const created = await userService.createUser({
      username,
      displayName: displayName || username,
      email: `${username}@centraldispatch.bm`,
      role,
      status: 'Active',
    });
    setUsers([...userService.getUsers()]);
    setUsername('');
    setDisplayName('');
    setTempPassword('');
    showToast(`Created user account for ${created.displayName} (${created.role})`);
  };

  const handleToggleStatus = async (id: string) => {
    const updated = await userService.toggleUserStatus(id);
    if (updated) {
      setUsers([...userService.getUsers()]);
      showToast(`Account status updated to ${updated.status} for ${updated.displayName}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            User Accounts
          </h1>
          <p className="text-sm font-semibold text-[#607286] mt-1">
            Super Admin can create and manage Admin and Staff sign-ins
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard space-y-4">
          <h2 className="text-base font-extrabold text-[#12345b] border-b border-[#e1e9f0] pb-2">
            Create User Account
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
                placeholder="e.g. jsmith"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
                placeholder="e.g. John Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:border-[#2f6fb3]"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff Assistant</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">Temporary Password</label>
              <div className="relative">
                <input
                  type={showTempPassword ? 'text' : 'password'}
                  value={tempPassword}
                  onChange={e => setTempPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
                  placeholder="ChangeMe123!"
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword(!showTempPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] focus:outline-none p-1 rounded-md transition-colors"
                  title={showTempPassword ? 'Hide password' : 'Show password'}
                >
                  {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create User</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard overflow-hidden">
          <div className="px-5 py-4 bg-[#edf4fa] border-b border-[#d9e4ee]">
            <h2 className="text-base font-extrabold text-[#12345b]">
              Existing Accounts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#12345b] text-white font-bold uppercase">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e9f0]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#f8fbfd]">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#183a61]">{u.displayName}</div>
                      <div className="text-[11px] text-[#607286]">{u.username} ({u.email})</div>
                    </td>
                    <td className="py-3 px-4 font-extrabold uppercase text-[#2f6fb3]">{u.role}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        u.status === 'Active' ? 'bg-[#d4eee9] text-[#145f57]' : 'bg-[#f7d8d5] text-[#8d251d]'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="px-2.5 py-1 bg-[#edf4fa] hover:bg-[#d6e7f4] text-[#102f52] font-bold text-xs rounded-lg"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
