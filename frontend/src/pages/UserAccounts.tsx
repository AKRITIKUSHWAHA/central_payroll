import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { userService } from '../services/userService';
import { UserAccount, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Users,
  Copy,
  Check,
  Eye,
  EyeOff,
  MoreVertical,
  Power
} from 'lucide-react';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const UserAccounts: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>(() => userService.getUsers());
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserAccount | null>(null);
  const [selectedUserForActions, setSelectedUserForActions] = useState<UserAccount | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadUsersFromDB = async () => {
    const fetched = await userService.fetchUsers();
    setUsers([...fetched]);
  };

  useEffect(() => {
    loadUsersFromDB();
  }, []);

  // Lock body scroll when Quick Actions modal is open
  useEffect(() => {
    if (selectedUserForActions) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedUserForActions]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await userService.createUser({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || username.trim(),
        email: `${username.trim().toLowerCase()}@centraldispatch.bm`,
        role,
        status: 'Active',
        password: tempPassword.trim() || 'ChangeMe123!',
      });

      await loadUsersFromDB();
      setUsername('');
      setDisplayName('');
      setTempPassword('');
      showToast(`User account created successfully for ${created.displayName} (${created.role})`);
    } catch (err: any) {
      showToast('Error creating user account: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const updated = await userService.toggleUserStatus(user.id);
      if (updated) {
        await loadUsersFromDB();
        showToast(`User account updated: ${user.displayName} is now ${updated.status}`);
      }
    } catch (err: any) {
      showToast('Error updating user status: ' + err.message);
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'staff': return 'Staff';
      default: return r;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-[#12345b] tracking-tight">
          User Accounts
        </h1>
        <p className="text-sm font-semibold text-[#607286] mt-0.5">
          Super Admin can create and manage Admin and Staff sign-ins.
        </p>
      </div>

      {/* Main Card: Create User (Left) & Access Rules (Right) */}
      <div className="bg-white border border-[#dde7f0] rounded-2xl p-6 shadow-cdCard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Create User Form */}
          <div>
            <h2 className="text-base font-extrabold text-[#12345b] mb-4">
              Create User
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#38516b] mb-1">
                  Username
                </label>
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
                <label className="block text-xs font-bold text-[#38516b] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
                  placeholder="e.g. John Smith"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#38516b] mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-bold text-[#1c2b3a] focus:border-[#2f6fb3] bg-white cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#38516b] mb-1">
                  Temporary Password
                </label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] p-1 cursor-pointer"
                    title={showTempPassword ? 'Hide password' : 'Show password'}
                  >
                    {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Access Rules Info Box */}
          <div className="border-l border-[#eef3f7] md:pl-8 space-y-4">
            <h2 className="text-base font-extrabold text-[#12345b] mb-4">
              Access Rules
            </h2>

            <div className="space-y-4 text-xs leading-relaxed text-[#38516b]">
              <p>
                <strong className="text-[#12345b] font-extrabold">Super Admin:</strong> full authority over payroll calculation & approval, user accounts, and permissions.
              </p>
              <p>
                <strong className="text-[#12345b] font-extrabold">Admin:</strong> staff management, schedules, leave calendars, customer invoices & general ledgers.
              </p>
              <p>
                <strong className="text-[#12345b] font-extrabold">Staff:</strong> view weekly shift schedules and write operational shift notes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: User Accounts List */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-[#12345b] px-1">
          User Accounts
        </h2>

        <div className="bg-white border border-[#dde7f0] rounded-2xl shadow-cdCard divide-y divide-[#eef3f7]">
          {users.map((u, idx) => {
            const isSelf = u.username === 'superadmin';
            const isActive = u.status === 'Active';
            const isLast = idx >= users.length - 2;

            return (
              <div
                key={u.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8fbfd] transition-colors relative"
              >
                {/* User Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 flex-1 items-center">
                  {/* Column 1: Role */}
                  <div className="font-extrabold text-[#12345b] text-sm flex items-center gap-2">
                    {u.role === 'superadmin' && <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                    {u.role === 'admin' && <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    {u.role === 'staff' && <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    <span>{getRoleLabel(u.role)}</span>
                  </div>

                  {/* Column 2: Username */}
                  <div className="font-mono text-xs font-bold text-[#607286]">
                    {u.username}
                  </div>

                  {/* Column 3: Display Name */}
                  <div className="font-bold text-[#12345b] text-xs">
                    {u.displayName || u.username}
                  </div>
                </div>

                {/* Right Actions: Disable/Enable Button + 3-Dot Dropdown */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Enable / Disable Button matching prototype */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#bdcbd9] hover:bg-[#fff0f0] hover:border-red-300 text-[#12345b] hover:text-red-700'
                        : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isActive ? 'Disable' : 'Enable'}
                  </button>

                  {/* 3-Dot Actions Menu Button (Opens Centered Modal) */}
                  <button
                    type="button"
                    onClick={() => setSelectedUserForActions(u)}
                    className="p-2 rounded-xl border border-[#d2e2ee] bg-white hover:bg-[#edf5fb] text-[#2f6fb3] hover:text-[#12345b] transition-all cursor-pointer shadow-2xs"
                    title={`Quick Actions for ${u.displayName}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTERED QUICK ACTIONS MODAL DIALOG (PORTAL TO DOCUMENT.BODY) */}
      {selectedUserForActions &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSelectedUserForActions(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-[#d0e0ee] w-full max-w-md overflow-hidden animate-scaleUp"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#edf4fa] border-b border-[#d8e5f0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2f6fb3] text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {selectedUserForActions.role === 'superadmin' ? '👑' : selectedUserForActions.role === 'admin' ? '🛡️' : '👤'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#12345b]">
                      {selectedUserForActions.displayName || selectedUserForActions.username}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#607286]">
                      <span>@{selectedUserForActions.username}</span>
                      <span>•</span>
                      <span className="font-bold text-[#2f6fb3]">{getRoleLabel(selectedUserForActions.role)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserForActions(null)}
                  className="p-1.5 rounded-lg text-[#607286] hover:text-[#12345b] hover:bg-white transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Modal Actions Body */}
              <div className="p-6 space-y-3 bg-white">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#8292a3] mb-1">
                  Account Actions
                </p>

                {/* Action 1: Copy Set Password Link */}
                <button
                  type="button"
                  onClick={() => {
                    const setupUrl = `${window.location.origin}/set-password?username=${encodeURIComponent(selectedUserForActions.username)}`;
                    navigator.clipboard.writeText(setupUrl);
                    setCopiedId(selectedUserForActions.id + '_setup');
                    showToast(`Password Setup link copied for ${selectedUserForActions.displayName}`);
                    setTimeout(() => setCopiedId(null), 2500);
                  }}
                  className="w-full p-3.5 bg-[#f8fbfe] hover:bg-[#edf5fb] border border-[#d6e7f4] hover:border-[#2f6fb3] rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e0effa] text-[#2f6fb3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {copiedId === (selectedUserForActions.id + '_setup') ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <strong className="block text-xs font-black text-[#12345b]">
                        {copiedId === (selectedUserForActions.id + '_setup') ? 'Setup Link Copied!' : 'Copy Set Password Link'}
                      </strong>
                      <span className="block text-[11px] font-semibold text-[#64748b]">
                        Share setup portal URL directly with staff
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#2f6fb3]">Copy</span>
                </button>

                {/* Action 2: Copy Login Credentials */}
                <button
                  type="button"
                  onClick={() => {
                    const loginUrl = window.location.origin + '/login';
                    const info = `Central Dispatch Portal Login:\nLink: ${loginUrl}\nUsername: ${selectedUserForActions.username}\nPassword: ${selectedUserForActions.password || 'ChangeMe123!'}\nRole: ${selectedUserForActions.role}`;
                    navigator.clipboard.writeText(info);
                    setCopiedId(selectedUserForActions.id);
                    showToast(`Sign-in credentials copied for ${selectedUserForActions.displayName}`);
                    setTimeout(() => setCopiedId(null), 2500);
                  }}
                  className="w-full p-3.5 bg-[#f8fbfe] hover:bg-[#edf5fb] border border-[#d6e7f4] hover:border-[#2f6fb3] rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e0effa] text-[#2f6fb3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {copiedId === selectedUserForActions.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <strong className="block text-xs font-black text-[#12345b]">
                        {copiedId === selectedUserForActions.id ? 'Credentials Copied!' : 'Copy Login Details'}
                      </strong>
                      <span className="block text-[11px] font-semibold text-[#64748b]">
                        Portal URL, username &amp; temporary password
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#2f6fb3]">Copy</span>
                </button>

                {/* Action 3: Direct Reset Password */}
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedUserForActions;
                    setSelectedUserForActions(null);
                    setSelectedUserForReset(target);
                  }}
                  className="w-full p-3.5 bg-[#fffdf5] hover:bg-[#fbf5e6] border border-[#faeec7] hover:border-amber-400 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fef3c7] text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-xs font-black text-[#92400e]">
                        Direct Reset Password
                      </strong>
                      <span className="block text-[11px] font-semibold text-[#a16207]">
                        Change password immediately in system
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700">Open</span>
                </button>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-[#f8fafc] border-t border-[#d8e5f0] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedUserForActions(null)}
                  className="px-5 py-2 bg-white hover:bg-[#f1f5f9] text-[#12345b] font-extrabold text-xs rounded-xl border border-[#cbd5e1] transition-all shadow-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Reset Password Modal */}
      <ChangePasswordModal
        isOpen={Boolean(selectedUserForReset)}
        targetUser={selectedUserForReset || undefined}
        onClose={() => {
          setSelectedUserForReset(null);
          loadUsersFromDB();
        }}
      />
    </div>
  );
};
