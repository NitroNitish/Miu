import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sounds } from '../../utils/soundEffects';

interface SwipeNavigationProps {
  children: React.ReactNode;
}

// Ordered main tabs
const MAIN_TABS = ['/chats', '/together', '/memories', '/profile'];

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isExcludedRef = useRef<boolean>(false);

  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Check if current route is a standalone / non-swipable screen
  const isExcludedRoute =
    location.pathname === '/' ||
    location.pathname === '/splash' ||
    location.pathname === '/login' ||
    location.pathname === '/auth' ||
    location.pathname.startsWith('/join') ||
    location.pathname.startsWith('/invite') ||
    location.pathname === '/doodle'; // Drawing canvas requires full touch freedom

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isExcludedRoute) return;

    const touch = e.touches[0];
    const target = e.target as HTMLElement | null;

    // Do not trigger swipe on inputs, buttons, sliders, canvases, or no-swipe containers
    if (
      target &&
      (target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('canvas') ||
        target.closest('[data-no-swipe="true"]') ||
        target.closest('.no-swipe'))
    ) {
      isExcludedRef.current = true;
      return;
    }

    isExcludedRef.current = false;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      isExcludedRoute ||
      isExcludedRef.current ||
      startXRef.current === null ||
      startYRef.current === null ||
      startTimeRef.current === null
    ) {
      startXRef.current = null;
      startYRef.current = null;
      startTimeRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    const deltaTime = Date.now() - startTimeRef.current;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Reset refs immediately
    const startX = startXRef.current;
    startXRef.current = null;
    startYRef.current = null;
    startTimeRef.current = null;

    // Swipe validation criteria:
    // 1. Must be fast enough (under 550ms)
    // 2. Must exceed threshold distance (>= 55px)
    // 3. Must be predominantly horizontal to avoid accidental trigger during vertical scroll
    if (deltaTime > 550 || absX < 55 || absX < absY * 1.5) {
      return;
    }

    const currentPath = location.pathname;

    // SPECIAL SUBPAGES: Edge swipe or back swipe
    if (currentPath === '/chat') {
      // Swiping right (finger moves right) goes back to /chats
      if (deltaX > 0) {
        triggerNavigation('/chats', 'right');
      } else if (deltaX < 0) {
        // Swiping left goes to /together
        triggerNavigation('/together', 'left');
      }
      return;
    }

    if (currentPath === '/together/tic-tac-toe' || currentPath === '/daily-question') {
      // Swiping right goes back to /together
      if (deltaX > 0) {
        triggerNavigation('/together', 'right');
      }
      return;
    }

    // MAIN TABS SWIPING (/chats <-> /together <-> /memories <-> /profile)
    const currentTabIdx = MAIN_TABS.indexOf(currentPath);
    if (currentTabIdx === -1) return;

    if (deltaX < 0) {
      // Swiping Left: Move to Next Tab
      if (currentTabIdx < MAIN_TABS.length - 1) {
        const nextPath = MAIN_TABS[currentTabIdx + 1];
        triggerNavigation(nextPath, 'left');
      }
    } else {
      // Swiping Right: Move to Previous Tab
      if (currentTabIdx > 0) {
        const prevPath = MAIN_TABS[currentTabIdx - 1];
        triggerNavigation(prevPath, 'right');
      }
    }
  };

  const triggerNavigation = (targetPath: string, direction: 'left' | 'right') => {
    // Gentle tactile feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore
      }
    }
    sounds.playPop();

    setSlideDirection(direction);
    navigate(targetPath);

    // Reset slide animation state after transition completes
    setTimeout(() => {
      setSlideDirection(null);
    }, 250);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`flex-1 flex flex-col min-w-0 w-full min-h-screen ${
        slideDirection === 'left'
          ? 'page-slide-left'
          : slideDirection === 'right'
          ? 'page-slide-right'
          : ''
      }`}
    >
      {children}
    </div>
  );
};

export default SwipeNavigation;
