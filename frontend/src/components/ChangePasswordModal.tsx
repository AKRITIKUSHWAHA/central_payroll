import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { KeyRound, X, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: { id: string; username: string; displayName?: string };
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, targetUser }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const userToChange = targetUser || currentUser;
  const isSelf = !targetUser || targetUser.id === currentUser?.id || targetUser.username === currentUser?.username;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !userToChange) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await userService.changePassword({
        userId: userToChange.id,
        username: userToChange.username,
        currentPassword: isSelf && currentUser?.role !== 'superadmin' ? currentPassword : undefined,
        newPassword
      });

      if (res.success) {
        showToast(res.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to update password');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#dde7f0] max-w-md w-full overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#12345b] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Change Password</h3>
              <p className="text-xs text-white/75">
                {userToChange.displayName || userToChange.username} ({userToChange.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
              {errorMsg}
            </div>
          )}

          {isSelf && currentUser?.role !== 'superadmin' && (
            <div>
              <label className="block text-xs font-bold text-[#38516b] mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-3.5 pr-10 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] p-1 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
                className="w-full pl-3.5 pr-10 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] p-1 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#38516b] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2 border border-[#bdcbd9] rounded-xl text-sm font-semibold focus:border-[#2f6fb3]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f4f7fb] hover:bg-[#e2eaf1] text-[#38516b] font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
