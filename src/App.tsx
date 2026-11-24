import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { BottomNavigation } from './components/navigation/BottomNavigation';
import { Sidebar } from './components/navigation/Sidebar';
import { SwipeNavigation } from './components/navigation/SwipeNavigation';

import { SplashScreen } from './pages/SplashScreen';
import { AuthPage } from './pages/AuthPage';
import { JoinPage } from './pages/JoinPage';
import { ChatPage } from './pages/ChatPage';
import { TogetherPage } from './pages/TogetherPage';
import { DoodlePage } from './pages/DoodlePage';
import { DailyQuestionPage } from './pages/DailyQuestionPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ProfilePage } from './pages/ProfilePage';
import { TicTacToePage } from './pages/TicTacToePage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Primary AI Chatbot and standalone auth/splash pages have no messaging sidebar or bottom tabs
  const isStandalonePage =
    location.pathname === '/' ||
    location.pathname === '/splash' ||
    location.pathname === '/login' ||
    location.pathname === '/auth' ||
    location.pathname === '/chat' ||
    location.pathname.startsWith('/join') ||
    location.pathname.startsWith('/invite');

  const hideBottomNavOnMobile =
    isStandalonePage ||
    location.pathname === '/chat' ||
    location.pathname === '/doodle';

  if (isStandalonePage) {
    return (
      <div className="h-full h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] transition-colors duration-200">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5]">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main App Content Viewport with Finger Swipe Navigation */}
      <SwipeNavigation>
        {children}
      </SwipeNavigation>

      {/* Mobile Fixed Bottom Navigation */}
      {!hideBottomNavOnMobile && <BottomNavigation />}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                {/* Opening Splash Screen on root */}
                <Route path="/" element={<SplashScreen />} />
                <Route path="/splash" element={<SplashScreen />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route path="/join" element={<JoinPage />} />
                <Route path="/join/:token" element={<JoinPage />} />
                <Route path="/invite" element={<JoinPage />} />
                <Route path="/invite/:token" element={<JoinPage />} />

                {/* Primary AI Chatbot & Magic Layer Screen */}
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Prevent exposing inbox/contacts in normal interface */}
                <Route path="/chats" element={<Navigate to="/chat" replace />} />
                
                {/* Secondary tools (accessible only via direct link or in-session) */}
                <Route path="/together" element={<TogetherPage />} />
                <Route path="/together/tic-tac-toe" element={<TicTacToePage />} />
                <Route path="/games/tic-tac-toe" element={<TicTacToePage />} />
                <Route path="/doodle" element={<DoodlePage />} />
                <Route path="/daily-question" element={<DailyQuestionPage />} />
                <Route path="/memories" element={<MemoriesPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Fallback to primary AI assistant */}
                <Route path="*" element={<Navigate to="/chat" replace />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
