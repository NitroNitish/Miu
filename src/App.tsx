import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

import { SplashScreen } from './pages/SplashScreen';
import { AuthPage } from './pages/AuthPage';
import { JoinPage } from './pages/JoinPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-full h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex flex-col bg-[#F7F4EF] dark:bg-[#111214] text-[#1C1B1F] dark:text-[#F5F5F5] transition-colors duration-200">
      {children}
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
                {/* Default root opens directly to Miu AI chatbot home page */}
                <Route path="/" element={<Navigate to="/chat" replace />} />
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

                {/* Profile & Settings (Accessible in-session) */}
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
