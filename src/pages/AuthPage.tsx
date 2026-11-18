import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, setThemeMode } = useTheme();

  const [identifier, setIdentifier] = useState('alexander@miu.app');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/chats');
    }, 350);
  };

  return (
    <div className="miu fixed inset-0 z-50 flex items-center justify-center bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] select-none animate-fade-in transition-colors duration-200">
      <div className="relative w-full max-w-[375px] h-full max-h-[812px] overflow-hidden bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] flex flex-col justify-between p-6">
        {/* Top Header with Theme Switcher (Replaces fake phone status bar) */}
        <div className="w-full flex items-center justify-between pt-2 z-20">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8C867E] dark:text-[#999999]">
            Private Session
          </span>
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

        {/* Login Form Content Section */}
        <div className="px-2 my-auto">
          <h1 className="text-[50px] font-bold tracking-[-2px] leading-none text-[#1C1B1F] dark:text-[#F5F5F5]">
            miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
          </h1>

          <h2 className="mt-[40px] text-[22px] font-semibold tracking-[-0.4px] text-[#1C1B1F] dark:text-[#F5F5F5]">
            Welcome back
          </h2>

          <p className="mt-[6px] text-[14px] text-[#8C867E] dark:text-[#999999]">
            Sign in to continue
          </p>

          <form onSubmit={handleLogin} className="mt-[44px]">
            {/* Email / Username field */}
            <label className="flex items-center gap-[14px] h-[58px] px-[18px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[16px] transition-colors focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC]">
              <span className="text-[20px] leading-none text-[#4A4640] dark:text-neutral-400">
                <i className="ph ph-envelope-simple" />
              </span>
              <input
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1C1B1F] dark:text-[#F5F5F5] placeholder-[#A39D95] dark:placeholder-neutral-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or username"
                required
              />
            </label>

            {/* Password field */}
            <label className="mt-[16px] flex items-center gap-[14px] h-[58px] px-[18px] bg-white dark:bg-[#191A1D] border border-[#EAE5DE] dark:border-[#303136] rounded-[16px] transition-colors focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC]">
              <span className="text-[20px] leading-none text-[#4A4640] dark:text-neutral-400">
                <i className="ph ph-lock-simple" />
              </span>
              <input
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1C1B1F] dark:text-[#F5F5F5] placeholder-[#A39D95] dark:placeholder-neutral-500"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[20px] leading-none text-[#4A4640] dark:text-neutral-400 hover:text-[#1C1B1F] dark:hover:text-neutral-200 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`ph ${showPassword ? 'ph-eye' : 'ph-eye-slash'}`} />
              </button>
            </label>

            {/* Primary Log in Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-[32px] w-full h-[52px] rounded-[16px] bg-[#1E1F24] dark:bg-[#B6A4DC] hover:opacity-90 active:scale-[0.99] text-white dark:text-[#111214] text-[15px] font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center"
            >
              {isLoading ? 'Signing in...' : 'Log in'}
            </button>

            {/* Forgot password */}
            <p
              onClick={() => alert('Password reset verification link sent to your device.')}
              className="mt-[28px] text-center text-[13px] text-[#4A4640] dark:text-neutral-400 hover:text-[#1C1B1F] dark:hover:text-neutral-200 cursor-pointer"
            >
              Forgot password?
            </p>
          </form>
        </div>

        {/* Home Indicator Bar */}
        <div className="relative h-10 w-full flex items-center justify-center">
          <div className="w-[134px] h-[5px] rounded-full bg-[#1C1B1F] dark:bg-[#F5F5F5]/40" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
