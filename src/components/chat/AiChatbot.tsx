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
  X,
  Clock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { askGemini } from '../../lib/gemini';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: AiChatMessage[];
}

interface AiChatbotProps {
  onTriggerSecretCommand: () => void;
}

const AI_STORAGE_KEY = 'miu_ai_chat_history';
const AI_SESSIONS_KEY = 'miu_recent_chat_sessions';
const AI_CURRENT_SESSION_KEY = 'miu_current_session_id';

// Default starter sessions
const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: 'session-sample-1',
    title: 'Quantum Computing & Qubits',
    timestamp: 'Today',
    messages: [
      {
        id: 'msg-s1-1',
        sender: 'user',
        content: 'Explain quantum computing simply',
        timestamp: '10:14 AM',
      },
      {
        id: 'msg-s1-2',
        sender: 'assistant',
        content:
          'Quantum computing uses qubits that exist in superpositions of 0 and 1 simultaneously, enabling complex calculations exponentially faster than classical computers.',
        timestamp: '10:14 AM',
      },
    ],
  },
  {
    id: 'session-sample-2',
    title: 'Social AI Platform Architecture',
    timestamp: 'Yesterday',
    messages: [
      {
        id: 'msg-s2-1',
        sender: 'user',
        content: 'What makes a social AI platform special?',
        timestamp: '3:30 PM',
      },
      {
        id: 'msg-s2-2',
        sender: 'assistant',
        content:
          'A thoughtful social AI platform emphasizes calm, private, and human-centric interaction over algorithmically noisy feeds.',
        timestamp: '3:30 PM',
      },
    ],
  },
  {
    id: 'session-sample-3',
    title: 'Weekend Creative Ideation',
    timestamp: '2 days ago',
    messages: [
      {
        id: 'msg-s3-1',
        sender: 'user',
        content: 'Give me 3 weekend project ideas',
        timestamp: '11:05 AM',
      },
      {
        id: 'msg-s3-2',
        sender: 'assistant',
        content:
          '1. Ambient sound generator\n2. Minimalist markdown garden\n3. Single-purpose productivity tool',
        timestamp: '11:05 AM',
      },
    ],
  },
];

// Explore pills row 1 and row 2 (duplicated for smooth infinite marquee loop)
const EXPLORE_ROW_1 = [
  'You and ME',
  'Social AI platform',
  'Quantum',
  'Robotics Challenge',
  'Neural Design',
  'You and ME',
  'Social AI platform',
  'Quantum',
  'Robotics Challenge',
  'Neural Design',
];

const EXPLORE_ROW_2 = [
  'Fire.',
  'Water is a',
  'Robotics Challenge',
  'Creative Writing',
  'Deep Space',
  'Fire.',
  'Water is a',
  'Robotics Challenge',
  'Creative Writing',
  'Deep Space',
];

export const AiChatbot: React.FC<AiChatbotProps> = ({ onTriggerSecretCommand }) => {
  const { isDark, setThemeMode } = useTheme();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Miu 2.5');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Dynamic visualViewport tracker for mobile virtual keyboard
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

  // Track the active session ID so all questions in the same chat stay within that session
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AI_CURRENT_SESSION_KEY) || null;
    } catch {
      return null;
    }
  });

  // Saved recent chat sessions list
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(AI_SESSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SESSIONS;
  });

  // Current active conversation messages
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
    try {
      localStorage.setItem(AI_SESSIONS_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  useEffect(() => {
    try {
      if (currentSessionId) {
        localStorage.setItem(AI_CURRENT_SESSION_KEY, currentSessionId);
      } else {
        localStorage.removeItem(AI_CURRENT_SESSION_KEY);
      }
    } catch {}
  }, [currentSessionId]);

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
        setTimeout(() => handleNewChat(), 100);
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
        "• **Superposition**: Particles can exist across multiple states simultaneously until measured.\n" +
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

  const handleSendText = async (textToSend?: string) => {
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

    // Determine or create the active session ID for this conversation
    const sessionId = currentSessionId || `session-${Date.now()}`;
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    const userMsg: AiChatMessage = {
      id: `ai-user-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    let responseText = '';
    try {
      // Local utility commands handled instantly
      if (trimmed.startsWith('/')) {
        responseText = generateAiResponse(trimmed);
      } else {
        // Live Gemini API completion with multi-turn conversation context
        responseText = await askGemini(trimmed, nextMessages);
      }
    } catch (err) {
      console.warn('Gemini request fallback to internal engine:', err);
      responseText = generateAiResponse(trimmed);
    } finally {
      setIsTyping(false);
    }

    const assistantMsg: AiChatMessage = {
      id: `ai-bot-${Date.now()}`,
      sender: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    const finalMessages = [...nextMessages, assistantMsg];
    setMessages(finalMessages);

    // FIX: Update the EXISTING session in history, do NOT create a new session for every question!
    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === sessionId);
      const title =
        existingIdx >= 0
          ? prev[existingIdx].title
          : trimmed.length > 32
          ? trimmed.slice(0, 30) + '...'
          : trimmed;

      const sessionObj: ChatSession = {
        id: sessionId,
        title,
        timestamp: 'Just now',
        messages: finalMessages,
      };

      const remaining = prev.filter((s) => s.id !== sessionId);
      return [sessionObj, ...remaining].slice(0, 15);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    try {
      localStorage.removeItem(AI_STORAGE_KEY);
      localStorage.removeItem(AI_CURRENT_SESSION_KEY);
    } catch {}
    setShowRecentChats(false);
  };

  const handleLoadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowRecentChats(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  const handleClearAllSessions = () => {
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    try {
      localStorage.removeItem(AI_SESSIONS_KEY);
      localStorage.removeItem(AI_STORAGE_KEY);
      localStorage.removeItem(AI_CURRENT_SESSION_KEY);
    } catch {}
    setShowRecentChats(false);
  };

  return (
    <div
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      className="w-full max-h-[100dvh] bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5] flex flex-col items-center overflow-hidden relative"
    >
      {/* 760px reference container */}
      <div className="w-full max-w-[760px] flex-1 min-h-0 flex flex-col bg-[#FAF9F7] dark:bg-[#111214] relative overflow-hidden">
        
        {/* ========================================================= */}
        {/* FLOATING TOP BUTTONS (NO HEADER BAR!)                     */}
        {/* ========================================================= */}
        <div className="shrink-0 flex-shrink-0 w-full px-5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-1 flex items-center justify-between select-none z-30">
          {/* Left: Floating circular hamburger button to see Recent Chats */}
          <button
            type="button"
            onClick={() => setShowRecentChats(true)}
            aria-label="Recent chats"
            title="Recent chats"
            className="w-10 h-10 rounded-full border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-80 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Right: Floating circular speech bubble button to start a new chat */}
          <button
            type="button"
            onClick={handleNewChat}
            title="New Conversation"
            aria-label="New Conversation"
            className="w-10 h-10 rounded-full border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] flex items-center justify-center text-[#171717] dark:text-[#F5F5F5] hover:opacity-80 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <MessageCircle className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* MAIN CONVERSATION / EXPLORE BODY (flex: 1, min-h: 0, scroll) */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-1 space-y-4 no-scrollbar overscroll-contain flex flex-col justify-between">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col justify-between py-2 select-none animate-fade-in">
              
              {/* BIG miu. LOGO: PLACED A LITTLE BIT DOWN & CENTERED */}
              <div className="w-full flex justify-center items-center pt-2 sm:pt-4 pb-2">
                <h1 className="text-[52px] sm:text-[68px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5] select-none leading-none">
                  miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
                </h1>
              </div>

              {/* CLEAN CENTER SPACE (NO LINES!) */}
              <div className="my-auto py-6" />

              {/* LOWER SECTION: CENTERED "Explore" & OPPOSITE DIRECTION MARQUEES */}
              <div className="pb-4 w-full overflow-hidden">
                {/* Word Explore in the Centre */}
                <h3 className="text-center text-[18px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5] mb-3">
                  Explore
                </h3>

                {/* Row 1: Marquee moving in one direction (Left) */}
                <div className="w-full overflow-hidden mb-2.5 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                  <div className="flex gap-2.5 w-max animate-marquee-left hover:[animation-play-state:paused]">
                    {EXPLORE_ROW_1.map((pill, idx) => (
                      <button
                        key={`${pill}-${idx}`}
                        type="button"
                        onClick={() => handleSendText(pill)}
                        className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 2: Marquee moving in the OPPOSITE direction (Right) */}
                <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                  <div className="flex gap-2.5 w-max animate-marquee-right hover:[animation-play-state:paused]">
                    {EXPLORE_ROW_2.map((pill, idx) => (
                      <button
                        key={`${pill}-${idx}`}
                        type="button"
                        onClick={() => handleSendText(pill)}
                        className="px-4 py-2 rounded-2xl border border-[#DCDAD5] dark:border-[#2C2E35] bg-[#FFFFFF] dark:bg-[#191A1D] text-xs sm:text-sm font-medium text-[#171717] dark:text-[#F5F5F5] hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-95 transition-all shadow-2xs whitespace-nowrap cursor-pointer shrink-0"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Active message stream */
            <div className="space-y-4 py-2 flex-1">
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
        {/* BOTTOM COMPOSER: Rounded Box                              */}
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

      {/* ========================================================= */}
      {/* RECENT CHATS SLIDE-OVER DRAWER (From Hamburger button)    */}
      {/* ========================================================= */}
      {showRecentChats && (
        <div className="fixed inset-0 z-[9999] flex select-none animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowRecentChats(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-[320px] bg-[#FFFFFF] dark:bg-[#16171A] border-r border-[#EEEEEC] dark:border-[#2C2E35] h-full flex flex-col justify-between z-10 shadow-2xl p-4 animate-slide-right">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEC] dark:border-[#2C2E35] mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-[#A99BCB] dark:text-[#B6A4DC]" />
                  <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">
                    Recent Chats
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecentChats(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-[#171717] dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Start New Chat Button */}
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 mb-3 rounded-xl bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Conversation</span>
              </button>

              {/* List of Recent Sessions */}
              <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)] no-scrollbar">
                {sessions.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-6">
                    No recent conversations
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleLoadSession(session)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left ${
                        currentSessionId === session.id
                          ? 'bg-neutral-100 dark:bg-neutral-800 border-l-2 border-[#A99BCB] dark:border-[#B6A4DC]'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5] truncate">
                          {session.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {session.timestamp} • {session.messages.length} messages
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-3 border-t border-[#EEEEEC] dark:border-[#2C2E35] space-y-2">
              <button
                type="button"
                onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                {isDark ? <Moon className="w-4 h-4 text-purple-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>

              <button
                type="button"
                onClick={handleClearAllSessions}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chats</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
