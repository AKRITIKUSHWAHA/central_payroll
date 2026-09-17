import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useToast } from '../context/ToastContext';
import { KeyRound, CheckCircle2, AlertTriangle, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const SetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userFromQuery = searchParams.get('username') || searchParams.get('user') || searchParams.get('email') || '';
    if (userFromQuery) {
      setUsernameOrEmail(userFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usernameOrEmail.trim()) {
      setError('Please enter your username or work email.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch<{ success: boolean; message?: string; error?: string }>('/user-accounts/set-password', {
        method: 'POST',
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          newPassword: newPassword.trim(),
        })
      });

      if (res && res.success) {
        setSuccess(true);
        showToast('Password set successfully!');
      } else {
        setError(res?.error || 'Failed to set password. Please check your username.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-[480px] bg-white border border-[#d7e2ec] rounded-2xl p-8 shadow-cdModal">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-[#0b7895] text-white flex items-center justify-center font-black text-sm shadow-md">
            ▶
          </div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Central Dispatch Staff
          </h1>
        </div>

        <p className="text-sm text-[#607286] font-medium mb-6 leading-relaxed">
          {success ? 'Your new password has been confirmed.' : 'Set your own account password to access Central Dispatch.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-[#f7d8d5] border border-[#a33b32] text-[#8d251d] text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-5">
            <div className="p-4 bg-[#e8f8f0] border border-[#2fa86d] text-[#1b6b43] text-sm font-bold rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2fa86d] flex-shrink-0" />
              <div>
                <p>Password set successfully!</p>
                <p className="text-xs font-normal text-[#2b724f] mt-0.5">You can now use your new password to sign in.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Proceed to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
                Username or Work Email
              </label>
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={e => setUsernameOrEmail(e.target.value)}
                placeholder="e.g. staff or user@centraldispatch.bm"
                className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-hidden focus:border-[#2f6fb3] focus:ring-2 focus:ring-[#2f6fb3]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-hidden focus:border-[#2f6fb3] focus:ring-2 focus:ring-[#2f6fb3]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] p-1 rounded-md"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-hidden focus:border-[#2f6fb3] focus:ring-2 focus:ring-[#2f6fb3]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#2f6fb3] hover:bg-[#245a96] disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Setting Password...' : 'Set New Password'}</span>
            </button>

            <div className="pt-3 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2f6fb3] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
