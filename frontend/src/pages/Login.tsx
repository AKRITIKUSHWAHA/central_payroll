import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, UserCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('prashant');
  const [password, setPassword] = useState('ChangeMe123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. Use superadmin / ChangeMe123! or prashant.');
    }
  };

  const handleQuickLogin = (roleUser: string) => {
    setUsername(roleUser);
    setPassword('ChangeMe123!');
    login(roleUser, 'ChangeMe123!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white border border-[#d7e2ec] rounded-2xl p-8 shadow-cdModal">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-[#0b7895] text-white flex items-center justify-center font-black text-sm shadow-md">
            ▶
          </div>
          <h1 className="text-2xl font-extrabold text-[#12345b] tracking-tight">
            Central Dispatch Payroll
          </h1>
        </div>
        
        <p className="text-sm text-[#607286] font-medium mb-6 leading-relaxed">
          Secure Bermuda workspace sign-in for Super Admin, Admin, and Staff members.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-[#f7d8d5] border border-[#a33b32] text-[#8d251d] text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3] focus:ring-2 focus:ring-[#2f6fb3]/20"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#38516b] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#b9c9d9] rounded-xl text-sm font-semibold text-[#1c2b3a] focus:outline-none focus:border-[#2f6fb3] focus:ring-2 focus:ring-[#2f6fb3]/20"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#607286] hover:text-[#12345b] focus:outline-none p-1 rounded-md transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#2f6fb3] hover:bg-[#245a96] text-white font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </form>

        {/* Quick Role Selection Buttons for Demonstration */}
        <div className="mt-6 pt-5 border-t border-[#e1e8ef]">
          <div className="text-xs font-extrabold text-[#607286] mb-2 uppercase tracking-wider">
            Quick Sign-In Presets:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('prashant')}
              className="py-1.5 px-2 bg-[#eaf4fb] hover:bg-[#d6e7f4] text-[#12345b] text-xs font-bold rounded-lg border border-[#c9def6] flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3 text-[#2f6fb3]" />
              <span>Prashant</span>
            </button>
            <button
              onClick={() => handleQuickLogin('alesia')}
              className="py-1.5 px-2 bg-[#f0f4f7] hover:bg-[#e2e8ee] text-[#12345b] text-xs font-bold rounded-lg border border-[#dde6ee] flex items-center justify-center gap-1"
            >
              <UserCheck className="w-3 h-3 text-[#0f766e]" />
              <span>Alesia</span>
            </button>
            <button
              onClick={() => handleQuickLogin('staff_assistant')}
              className="py-1.5 px-2 bg-[#fff8c7] hover:bg-[#f5ebaa] text-[#6e5a00] text-xs font-bold rounded-lg border border-[#eadc64] flex items-center justify-center gap-1"
            >
              <span>Staff</span>
            </button>
          </div>
        </div>

        <div className="mt-5 p-3.5 bg-[#fff8d7] border border-[#eadb83] rounded-xl text-xs text-[#675600] leading-relaxed">
          <strong className="block mb-1 font-bold">First-time setup:</strong>
          Sign in with username <strong>superadmin</strong> and temporary password <strong>ChangeMe123!</strong>, or select Prashant (Super Admin).
        </div>
      </div>
    </div>
  );
};
