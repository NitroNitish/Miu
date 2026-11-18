import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, AlertCircle, User, Lock, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, setThemeMode } = useTheme();
  const { login, register, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    if (mode === 'login') {
      const res = await login(username, password);
      setIsLoading(false);
      if (res.success) {
        navigate('/chats');
      } else {
        setErrorMessage(res.error || 'Invalid username or password.');
      }
    } else {
      const res = await register(
        username,
        password,
        displayName.trim() || username.trim()
      );
      setIsLoading(false);
      if (res.success) {
        navigate('/chats');
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="miu fixed inset-0 z-50 flex items-center justify-center bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] select-none animate-fade-in transition-colors duration-200">
      <div className="relative w-full max-w-[385px] h-full max-h-[812px] overflow-hidden bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] flex flex-col justify-between p-6">
        {/* Top Header with Theme Switcher */}
        <div className="w-full flex items-center justify-between pt-2 z-20">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C867E] dark:text-[#999999]">
              Private Session
            </span>
            {!isConfigured && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                Demo Mode
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className="p-2 rounded-full text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Login / Register Content Section */}
        <div className="px-2 my-auto">
          <h1 className="text-[50px] font-bold tracking-[-2px] leading-none text-[#1C1B1F] dark:text-[#F5F5F5]">
            miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
          </h1>

          <div className="mt-8 flex items-center p-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300/40 dark:border-neutral-700/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#191A1D] text-[#1C1B1F] dark:text-[#F5F5F5] shadow-xs'
                  : 'text-[#8C867E] dark:text-[#999999] hover:text-[#1C1B1F] dark:hover:text-[#F5F5F5]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#191A1D] text-[#1C1B1F] dark:text-[#F5F5F5] shadow-xs'
                  : 'text-[#8C867E] dark:text-[#999999] hover:text-[#1C1B1F] dark:hover:text-[#F5F5F5]'
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.4px] text-[#1C1B1F] dark:text-[#F5F5F5]">
            {mode === 'login' ? 'Welcome back' : 'Create your username'}
          </h2>

          <p className="mt-[4px] text-[13px] text-[#8C867E] dark:text-[#999999]">
            {mode === 'login'
              ? 'Sign in to access your private messages'
              : 'Private space for two. No email or phone needed.'}
          </p>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            {/* Username field (No email asked) */}
            <label className="flex items-center gap-[12px] h-[54px] px-[16px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[16px] transition-colors focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC]">
              <span className="text-neutral-500 text-sm font-semibold select-none">@</span>
              <input
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1C1B1F] dark:text-[#F5F5F5] placeholder-[#A39D95] dark:placeholder-neutral-500"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Username (e.g. alexander)"
                required
                autoCapitalize="none"
              />
            </label>

            {/* Display Name field in register mode */}
            {mode === 'register' && (
              <label className="flex items-center gap-[12px] h-[54px] px-[16px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[16px] transition-colors focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC] animate-fade-in">
                <User className="w-4 h-4 text-[#8C867E] dark:text-neutral-400 shrink-0" />
                <input
                  className="flex-1 bg-transparent outline-none text-[14px] text-[#1C1B1F] dark:text-[#F5F5F5] placeholder-[#A39D95] dark:placeholder-neutral-500"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name (e.g. Alexander)"
                />
              </label>
            )}

            {/* Password field */}
            <label className="flex items-center gap-[12px] h-[54px] px-[16px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[16px] transition-colors focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC]">
              <Lock className="w-4 h-4 text-[#8C867E] dark:text-neutral-400 shrink-0" />
              <input
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1C1B1F] dark:text-[#F5F5F5] placeholder-[#A39D95] dark:placeholder-neutral-500"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[18px] leading-none text-[#4A4640] dark:text-neutral-400 hover:text-[#1C1B1F] dark:hover:text-neutral-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`ph ${showPassword ? 'ph-eye' : 'ph-eye-slash'}`} />
              </button>
            </label>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full h-[52px] rounded-[16px] bg-[#1E1F24] dark:bg-[#B6A4DC] hover:opacity-90 active:scale-[0.99] text-white dark:text-[#111214] text-[15px] font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                mode === 'login' ? 'Signing in...' : 'Creating space...'
              ) : (
                <>
                  <span>{mode === 'login' ? 'Log in' : 'Create Account'}</span>
                  {mode === 'register' && <Sparkles className="w-4 h-4" />}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Home Indicator Bar */}
        <div className="relative h-8 w-full flex items-center justify-center">
          <div className="w-[134px] h-[5px] rounded-full bg-[#1C1B1F] dark:bg-[#F5F5F5]/40" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
