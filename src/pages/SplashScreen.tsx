import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  autoRedirect?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  autoRedirect = true,
}) => {
  const navigate = useNavigate();
  const { isDark, setThemeMode } = useTheme();

  useEffect(() => {
    // Check if URL has invite parameters (e.g. from redirect or query string)
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('join') || params.get('token') || params.get('code');
    if (inviteParam) {
      navigate(`/join/${encodeURIComponent(inviteParam)}`, { replace: true });
      return;
    }

    if (!autoRedirect) return;
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      } else {
        navigate('/login');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [autoRedirect, navigate, onFinish]);

  const handleSkip = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      onClick={handleSkip}
      className="miu fixed inset-0 z-50 flex items-center justify-center bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] select-none cursor-pointer transition-colors duration-200"
    >
      <div className="relative w-full max-w-[375px] h-full max-h-[812px] bg-[#F7F4EF] dark:bg-[#111214] overflow-hidden flex flex-col justify-between p-6">
        {/* Top subtle theme toggle button (replaces fake phone status bar) */}
        <div className="w-full flex justify-end pt-2 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setThemeMode(isDark ? 'light' : 'dark');
            }}
            className="p-2 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Logo Centering Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center pb-[30px] pointer-events-none">
          <h1 className="text-[58px] font-bold tracking-[-2.5px] leading-none select-none text-[#1C1B1F] dark:text-[#F5F5F5]">
            miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
          </h1>
        </div>

        {/* Tagline Text */}
        <p className="absolute left-0 right-0 bottom-[112px] text-center text-[13px] text-[#8C867E] dark:text-[#999999]">
          Private by design.
        </p>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-[9px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full bg-[#1C1B1F] dark:bg-[#F5F5F5]/40" />
      </div>
    </div>
  );
};
