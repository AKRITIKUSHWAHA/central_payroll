import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect directly into the app
  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'staff' ? '/my-time' : '/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        const saved = localStorage.getItem('cdl_current_auth_user');
        const user = saved ? JSON.parse(saved) : null;
        if (user?.role === 'staff' || username.toLowerCase() === 'staff') {
          navigate('/my-time', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError('Invalid username or password.');
      }
    } catch {
      setError('An error occurred during sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#f4f7fb] flex items-center justify-center p-3.5 xs:p-5 sm:p-6 md:p-8 animate-fadeIn w-full">
      <div className="w-full max-w-[440px] bg-white border border-[#dde7f0] rounded-2xl sm:rounded-3xl p-5 xs:p-6 sm:p-8 shadow-sm transition-all mx-auto">
        {/* Title */}
        <h1 className="text-xl xs:text-2xl sm:text-[26px] font-black text-[#102f52] tracking-tight mb-1.5 sm:mb-2 leading-tight">
          Central Dispatch Payroll
        </h1>
        
        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#475569] font-medium mb-5 sm:mb-6 leading-relaxed sm:leading-snug">
          Secure workspace sign-in for Super Admin, Admin, and Staff.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#102f52] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-white border-2 border-black rounded-xl text-sm font-semibold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2f6fb3]/20"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#102f52] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-3.5 pr-10 py-2.5 min-h-[44px] bg-white border border-[#cbd5e1] rounded-xl text-sm font-semibold text-[#1e293b] focus:outline-none focus:border-black focus:ring-2 focus:ring-[#2f6fb3]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#102f52] p-1.5 cursor-pointer touch-manipulation"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[44px] px-4 bg-[#2f6fb3] hover:bg-[#245a96] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* First-time setup yellow callout box */}
        <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 bg-[#fefce8] border border-[#fef08a] rounded-xl text-[11px] sm:text-xs leading-relaxed text-[#713f12]">
          <strong>First-time setup:</strong> sign in with username <strong className="font-bold text-[#1e293b]">superadmin</strong> and temporary password <strong className="font-bold text-[#1e293b]">ChangeMe123!</strong>, then immediately create your own Super Admin account/password in User Accounts and disable or change the temporary account.
        </div>
      </div>
    </div>
  );
};
