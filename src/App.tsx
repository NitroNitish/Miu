import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { BottomNavigation } from './components/navigation/BottomNavigation';
import { Sidebar } from './components/navigation/Sidebar';

import { SplashScreen } from './pages/SplashScreen';
import { AuthPage } from './pages/AuthPage';
import { ChatsPage } from './pages/ChatsPage';
import { ChatPage } from './pages/ChatPage';
import { TogetherPage } from './pages/TogetherPage';
import { DoodlePage } from './pages/DoodlePage';
import { DailyQuestionPage } from './pages/DailyQuestionPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { ProfilePage } from './pages/ProfilePage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isStandalonePage =
    location.pathname === '/' ||
    location.pathname === '/splash' ||
    location.pathname === '/login' ||
    location.pathname === '/auth';

  // Certain screens like active Chat and Doodle have their own immersive bottom composer/toolbar on mobile
  const hideBottomNavOnMobile =
    isStandalonePage ||
    location.pathname === '/chat' ||
    location.pathname === '/doodle';

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] transition-colors duration-200">
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5]">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      {!hideBottomNavOnMobile && <BottomNavigation />}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              {/* Opening Splash Screen on root */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />

              {/* Main Application Screens */}
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/together" element={<TogetherPage />} />
              <Route path="/doodle" element={<DoodlePage />} />
              <Route path="/daily-question" element={<DailyQuestionPage />} />
              <Route path="/memories" element={<MemoriesPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
