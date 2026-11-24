import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  MessageCircle,
  Plus,
  ChevronDown,
  ArrowUp,
  AudioLines,
  Sun,
  Moon,
  Trash2,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiChatbotProps {
  onTriggerSecretCommand: () => void;
}

const AI_STORAGE_KEY = 'miu_ai_chat_history';

// Explore pills matching the user's sketch
const EXPLORE_PILLS = [
  'You and ME',
  'Social AI platform',
  'Quantum',
  'Fire.',
  'Water is a',
  'Robotics Challenge',
];

export const AiChatbot: React.FC<AiChatbotProps> = ({ onTriggerSecretCommand }) => {
  const { isDark, setThemeMode } = useTheme();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Miu 2.5');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamically track visualViewport for mobile virtual keyboards
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(AI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleInputFocus = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  };

  // Generate intelligent decoy responses for any prompt or command
  const generateAiResponse = (userPrompt: string): string => {
    const trimmed = userPrompt.trim().toLowerCase();

    // Wrong commands handler (user requirement: "Wrong commands behave normally like chatbot messages")
    if (trimmed.startsWith('/')) {
      if (trimmed === '/help') {
        return (
          "Here are the available Miu commands:\n\n" +
          "• `/help` - View this help guide\n" +
          "• `/clear` - Clear conversation\n" +
          "• `/summarize` - Summarize discussion\n" +
          "• `/status` - Assistant status and engine health\n" +
          "• `/explore` - Show exploration topics"
        );
      }
      if (trimmed === '/clear') {
        setTimeout(() => handleClearHistory(), 100);
        return 'Clearing conversation history...';
      }
      if (trimmed === '/status') {
        return '🟢 miu. Assistant Engine is online.\nModel: Neural Core v2.5\nLatency: 14ms\nStatus: Optimal';
      }
      return `Command \`${userPrompt}\` recognized. For a list of commands, type \`/help\`.`;
    }

    // Specific Explore pill queries
    if (trimmed.includes('you and me')) {
      return (
        "**You and ME**: Building a seamless symbiosis between human intuition and artificial intelligence.\n\n" +
        "I'm here to complement your thoughts, draft your words, organize your projects, and discover new ideas together."
      );
    }
    if (trimmed.includes('social ai platform')) {
      return (
        "**Social AI Platform**: The next generation of personal computing blends conversational intelligence with thoughtful design.\n\n" +
        "Unlike cluttered legacy feeds, miu. focuses on serene, private, and focused interactions tailored around you."
      );
    }
    if (trimmed.includes('quantum')) {
      return (
        "**Quantum Mechanics** explores nature at the fundamental atomic level:\n\n" +
        "• **Superposition**: Particles can exist across multiple states until measured.\n" +
        "• **Entanglement**: Two quantum particles can remain instantaneously connected regardless of distance.\n" +
        "• **Quantum Computing**: Uses quantum bits (qubits) to perform complex calculations exponentially faster."
      );
    }
    if (trimmed.includes('fire')) {
      return (
        "**Fire** is a rapid exothermic chemical oxidation process that releases heat, light, and reaction products.\n\n" +
        "It was humanity's first foundational discovery, shaping language, cooking, metallurgy, and civilization."
      );
    }
    if (trimmed.includes('water is a')) {
      return (
        "**Water** is a transparent, odorless, and tasteless chemical compound formed by two hydrogen atoms and one oxygen atom (H₂O).\n\n" +
        "It covers ~71% of Earth's surface and is the universal solvent essential for all known biological life."
      );
    }
    if (trimmed.includes('robotics')) {
      return (
        "**Robotics Challenges** push the frontiers of modern engineering:\n\n" +
        "1. **Bipedal Balance & Agility**: Navigating unpredictable terrains autonomously.\n" +
        "2. **Fine Motor Manipulation**: Handling delicate objects with soft-touch tactile feedback.\n" +
        "3. **Real-time Spatial Perception**: Processing sensor fusion for immediate decision-making."
      );
    }

    // General conversation
    if (trimmed.includes('hello') || trimmed.includes('hi') || trimmed.includes('hey')) {
      return "Hello! I'm miu. How can I assist you with your thoughts or tasks today?";
    }
    if (trimmed.includes('thank')) {
      return "You're always welcome! Let me know whenever you'd like to explore further.";
    }

    return (
      `Here are my insights on "${userPrompt.slice(0, 45)}${userPrompt.length > 45 ? '...' : ''}":\n\n` +
      "This topic involves several key dimensions: establishing the foundational principles, assessing current challenges, and identifying practical applications. Would you like me to dive deeper into any specific aspect?"
    );
  };

  const handleSendText = (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : input;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // SECRET COMMAND INTERCEPTION:
    // Intercepted locally, never sent to AI, never saved to AI history
    if (trimmed.toLowerCase() === '/qupa') {
      setInput('');
      onTriggerSecretCommand();
      return;
    }

    const userMsg: AiChatMessage = {
      id: `ai-user-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateAiResponse(trimmed);
      const assistantMsg: AiChatMessage = {
        id: `ai-bot-${Date.now()}`,
        sender: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(AI_STORAGE_KEY);
    } catch {}
    setShowMenu(false);
  };

  const handlePillClick = (pill: string) => {
    handleSendText(pill);
  };

  return (
    <div
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      className="w-full max-h-[100dvh] bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5] flex flex-col items-center overflow-hidden"
    >
      {/* 760px reference container */}
      <div className="w-full max-w-[760px] flex-1 min-h-0 flex flex-col bg-[#FAF9F7] dark:bg-[#111214] relative overflow-hidden">
        
        {/* ========================================================= */}
        {/* TOP BAR: Left hamburger in circle, Right bubble in circle */}
        {/* ========================================================= */}
        <header className="shrink-0 flex-shrink-0 w-full px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between select-none z-30">
          {/* Left: Hamburger menu in circle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Menu"
              className="w-10 h-10 rounded-full border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-80 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute left-0 top-12 w-48 bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl shadow-xl py-2 z-50 animate-slide-up text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode(isDark ? 'light' : 'dark');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[#171717] dark:text-[#F5F5F5] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
                    <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
                  </button>

                  <div className="my-1 border-t border-[#EEEEEC] dark:border-[#303136]" />

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear conversation</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Speech bubble in circle */}
          <button
            type="button"
            onClick={handleClearHistory}
            title="New Chat"
            aria-label="New Chat"
            className="w-10 h-10 rounded-full border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-80 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 stroke-[1.8]" />
          </button>
        </header>

        {/* ========================================================= */}
        {/* MAIN CONVERSATION / EXPLORE BODY (flex: 1, min-h: 0, scroll) */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-4 no-scrollbar overscroll-contain flex flex-col">
          {/* If there are no messages, show the exact sketch view */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-between py-2 select-none animate-fade-in">
              {/* Upper Section: Big "miu." Title */}
              <div className="pt-2 px-1">
                <h1 className="text-[52px] sm:text-[64px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5] leading-none">
                  miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
                </h1>
              </div>

              {/* Center Artistic Fluid Line (Matching the "S" curve wave in the sketch) */}
              <div className="my-auto py-4 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-full max-w-[340px] h-[170px] opacity-85 text-[#171717] dark:text-[#F5F5F5]"
                  viewBox="0 0 340 170"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="miuWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#171717" className="dark:stop-color-[#F5F5F5]" />
                      <stop offset="50%" stopColor="#A99BCB" className="dark:stop-color-[#B6A4DC]" />
                      <stop offset="100%" stopColor="#171717" className="dark:stop-color-[#F5F5F5]" />
                    </linearGradient>
                  </defs>
                  {/* Organic S-curve path matching sketch precisely */}
                  <path
                    d="M 12 110 C 80 110, 115 145, 175 145 C 270 145, 335 125, 335 72 C 335 25, 230 20, 165 42 C 160 44, 158 55, 172 65 C 220 85, 310 82, 335 84"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-75 transition-colors"
                  />
                </svg>
              </div>

              {/* Lower Section: "Explore" Header & Organic Prompt Pills */}
              <div className="pb-3">
                <h3 className="text-[17px] font-semibold text-[#171717] dark:text-[#F5F5F5] mb-3 px-1">
                  Explore
                </h3>

                {/* Row 1 */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => handlePillClick('You and ME')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    You and ME
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick('Social AI platform')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    Social AI platform
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick('Quantum')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    Quantum
                  </button>
                </div>

                {/* Row 2 */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePillClick('Fire.')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    Fire.
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick('Water is a')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    Water is a
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePillClick('Robotics Challenge')}
                    className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    Robotics Challen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active message stream */
            <div className="space-y-4 py-2">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${
                      isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        m.
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed break-words shadow-xs ${
                        isUser
                          ? 'bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] rounded-tr-xs'
                          : 'bg-[#FFFFFF] dark:bg-[#191A1D] text-[#171717] dark:text-[#EAEAEA] border border-[#EEEEEC] dark:border-[#303136] rounded-tl-xs whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex items-center gap-3 mr-auto max-w-[85%] animate-fade-in">
                  <div className="w-7 h-7 rounded-full bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] flex items-center justify-center shrink-0 text-xs font-bold">
                    m.
                  </div>
                  <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* ========================================================= */}
        {/* BOTTOM COMPOSER: Rounded Box exactly matching the sketch  */}
        {/* "Ask miu. ....." with + on left, v and (|||) on right       */}
        {/* ========================================================= */}
        <div className="shrink-0 flex-shrink-0 w-full p-4 pt-1 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30">
          <div className="w-full bg-[#FFFFFF] dark:bg-[#191A1D] border-2 border-[#171717] dark:border-[#353842] rounded-3xl p-3 shadow-md flex flex-col justify-between min-h-[92px] transition-all focus-within:border-[#A99BCB] dark:focus-within:border-[#B6A4DC]">
            {/* Top row: Textarea with "Ask miu. ....." placeholder */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder="Ask miu. ....."
              rows={1}
              className="w-full bg-transparent text-[15.5px] text-[#171717] dark:text-[#F5F5F5] placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:outline-none resize-none py-1 leading-normal font-normal"
            />

            {/* Bottom row: + on left, v dropdown and (|||) audio/send on right */}
            <div className="flex items-center justify-between pt-1 select-none">
              {/* Left: Plus icon (+) */}
              <button
                type="button"
                onClick={() => {
                  textareaRef.current?.focus();
                  if (!input) setInput('Tell me more about ');
                }}
                title="Add prompt / actions"
                aria-label="Add prompt"
                className="w-7 h-7 flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-70 active:scale-90 transition-all cursor-pointer"
              >
                <Plus className="w-5.5 h-5.5 stroke-[2.4]" />
              </button>

              {/* Right: Dropdown chevron (v) and Audio waveform circle button */}
              <div className="flex items-center gap-3">
                {/* Model / Option Dropdown Chevron (v) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    title="Select model options"
                    aria-label="Options"
                    className="p-1 text-[#171717] dark:text-[#F5F5F5] hover:opacity-70 active:scale-90 transition-all cursor-pointer flex items-center"
                  >
                    <ChevronDown className="w-5 h-5 stroke-[2.4]" />
                  </button>

                  {/* Model Dropdown */}
                  {showModelDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowModelDropdown(false)}
                      />
                      <div className="absolute right-0 bottom-8 w-36 bg-[#FFFFFF] dark:bg-[#1E2026] border border-[#EEEEEC] dark:border-[#303136] rounded-xl shadow-lg py-1.5 z-50 text-xs font-medium">
                        {['Miu 2.5', 'Miu Pro', 'Creative'].map((mod) => (
                          <button
                            key={mod}
                            type="button"
                            onClick={() => {
                              setSelectedModel(mod);
                              setShowModelDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                              selectedModel === mod ? 'font-bold text-[#A99BCB] dark:text-[#B6A4DC]' : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {mod}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Far Right: Circular Waveform / Voice Button (or Send Arrow when text typed) */}
                <button
                  type="button"
                  onClick={() => handleSendText()}
                  aria-label={input.trim() ? 'Send message' : 'Voice input'}
                  title={input.trim() ? 'Send' : 'Voice input'}
                  className="w-8 h-8 rounded-full border border-[#171717] dark:border-[#353842] bg-[#FFFFFF] dark:bg-[#191A1D] flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-80 active:scale-90 transition-all shadow-2xs cursor-pointer"
                >
                  {input.trim() ? (
                    <ArrowUp className="w-4 h-4 stroke-[2.4]" />
                  ) : (
                    <AudioLines className="w-4.5 h-4.5 stroke-[2]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
