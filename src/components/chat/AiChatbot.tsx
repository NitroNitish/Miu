import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowUp, Sun, Moon, Trash2, Bot, CornerDownLeft } from 'lucide-react';
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

const SUGGESTIONS = [
  '💡 Brainstorm ideas for a weekend project',
  '📝 Help me draft a professional message',
  '⚡ Explain quantum physics simply',
  '🎯 5 steps to organize daily priorities',
];

export const AiChatbot: React.FC<AiChatbotProps> = ({ onTriggerSecretCommand }) => {
  const { isDark, setThemeMode } = useTheme();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(AI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        content:
          "Hello! I'm Miu, your personal AI assistant. You can ask me questions, request writing assistance, brainstorm ideas, or try commands like `/help`.",
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Generate intelligent decoy responses for any prompt or command
  const generateAiResponse = (userPrompt: string): string => {
    const trimmed = userPrompt.trim().toLowerCase();

    // Wrong commands handler (user request: "Wrong commands behave normally like chatbot messages")
    if (trimmed.startsWith('/')) {
      if (trimmed === '/help') {
        return (
          "Here are the available assistant commands:\n\n" +
          "• `/help` - View this help guide\n" +
          "• `/clear` - Clear current conversation history\n" +
          "• `/summarize` - Summarize the previous discussion\n" +
          "• `/ideas` - Generate creative brainstorming prompts\n" +
          "• `/status` - Check assistant latency and model information\n" +
          "• `/notes` - Quick note-taking mode"
        );
      }
      if (trimmed === '/clear') {
        setTimeout(() => handleClearHistory(), 100);
        return 'Clearing conversation history...';
      }
      if (trimmed === '/status') {
        return '🟢 Miu Assistant v2.5 is online.\nEngine: Neural Assistant Core\nLatency: 18ms\nStatus: Healthy';
      }
      if (trimmed === '/summarize') {
        return 'Here is a quick summary of our conversation so far: We have been exploring various topics and commands in Miu AI.';
      }
      if (trimmed === '/ideas') {
        return (
          "Here are three creative project ideas:\n\n" +
          "1. **Micro-Habit Tracker**: A lightweight visual dashboard for daily 5-minute goals.\n" +
          "2. **Ambient Sound Generator**: Interactive soothing soundscapes for deep focus.\n" +
          "3. **Curated Reading Digest**: An automated weekly clipping collector for articles you love."
        );
      }
      if (trimmed === '/notes') {
        return 'Note mode active: Enter any thought or snippet and I will format and catalog it for you.';
      }
      return `Command \`${userPrompt}\` recognized. For a list of supported operations, type \`/help\`.`;
    }

    // Contextual responses for general conversation
    if (trimmed.includes('hello') || trimmed.includes('hi') || trimmed.includes('hey')) {
      return 'Hello! How can I assist you with your work, thoughts, or projects today?';
    }
    if (trimmed.includes('quantum')) {
      return (
        "Quantum physics studies how matter and light behave at microscopic atomic and subatomic levels.\n\n" +
        "Unlike classical physics where things exist in definite states, quantum particles can exist in a **superposition** of states at the same time until measured, and can exhibit **entanglement**, where particles remain interconnected across vast distances."
      );
    }
    if (trimmed.includes('weekend') || trimmed.includes('project') || trimmed.includes('brainstorm')) {
      return (
        "Here are three practical weekend project ideas:\n\n" +
        "1. **Smart Bookmarking Tool**: Organize favorite web references with tags and quick search.\n" +
        "2. **Personal Wiki / Digital Garden**: Write interconnected notes on topics you are learning.\n" +
        "3. **Offline Photo Journal**: Curate a minimalist chronological photo album."
      );
    }
    if (trimmed.includes('priority') || trimmed.includes('organize') || trimmed.includes('productivity')) {
      return (
        "Here is a proven 5-step daily priority framework:\n\n" +
        "1. Identify your **One Big Thing** (the most impactful task for the day).\n" +
        "2. Schedule a 90-minute uninterrupted deep-work block.\n" +
        "3. Group minor admin tasks into a single 30-minute batch.\n" +
        "4. Take brief 5-minute movement breaks every hour.\n" +
        "5. Review progress at the end of the day and write tomorrow's top goal."
      );
    }
    if (trimmed.includes('thank')) {
      return "You're very welcome! Let me know if you need help with anything else.";
    }

    return (
      `That is an insightful question regarding "${userPrompt.slice(0, 40)}${userPrompt.length > 40 ? '...' : ''}".\n\n` +
      "To address this effectively, we can break it down into core components: analyzing the primary objectives, identifying key constraints, and applying an iterative solution. Would you like me to elaborate on specific details or provide an outline?"
    );
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // SECRET COMMAND INTERCEPTION:
    // User requirement:
    // - "When the user enters the secret command `/qupa`, intercept it locally and instantly open the private conversation with the single authorized person."
    // - "Secret command must never be sent to the AI or stored in chat history."
    // - "Wrong commands behave normally like chatbot messages."
    if (trimmed.toLowerCase() === '/qupa') {
      setInput('');
      onTriggerSecretCommand();
      return;
    }

    // Normal message flow
    const userMsg: AiChatMessage = {
      id: `ai-user-${Date.now()}`,
      sender: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Realistic typing response latency (350ms - 650ms)
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
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    const welcome: AiChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      sender: 'assistant',
      content: "Conversation history cleared. What would you like to explore next?",
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages([welcome]);
    try {
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify([welcome]));
    } catch {}
  };

  return (
    <div className="w-full h-screen h-[100dvh] bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5] flex flex-col items-center overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Centered container */}
      <div className="w-full max-w-[760px] h-full flex flex-col bg-[#FFFFFF] dark:bg-[#15161A] border-x border-[#EAE8E4] dark:border-[#22242A] relative shadow-lg overflow-hidden">
        {/* Decoy AI Chatbot Header */}
        <header className="shrink-0 w-full px-4 py-3 border-b border-[#EEEEEC] dark:border-[#26282F] bg-[#FFFFFF]/95 dark:bg-[#15161A]/95 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#A855F7] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4.5 h-4.5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-[15px] font-semibold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
                  Miu AI
                </h1>
                <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                  v2.5
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Assistant ready
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear chat history"
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
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
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#A855F7] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed break-words shadow-xs ${
                    isUser
                      ? 'bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] rounded-tr-xs'
                      : 'bg-neutral-100 dark:bg-[#1E2026] text-[#171717] dark:text-[#EAEAEA] border border-neutral-200/60 dark:border-neutral-800/80 rounded-tl-xs whitespace-pre-wrap'
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#A855F7] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-neutral-100 dark:bg-[#1E2026] border border-neutral-200/60 dark:border-neutral-800/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
              </div>
            </div>
          )}

          {/* Prompt Suggestions if conversation is short */}
          {messages.length <= 2 && (
            <div className="pt-4 pb-2">
              <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2 px-1">
                Suggested prompts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setInput(item.replace(/^[^\s]+\s/, ''));
                    }}
                    className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-800 text-left text-xs text-neutral-700 dark:text-neutral-300 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-3 bg-[#FFFFFF] dark:bg-[#15161A] border-t border-[#EEEEEC] dark:border-[#26282F]">
          <div className="flex items-end gap-2 bg-neutral-100 dark:bg-[#1E2026] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 px-3 focus-within:ring-2 focus-within:ring-[#A855F7]/40 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Miu AI anything... (or /help)"
              rows={1}
              className="flex-1 max-h-32 bg-transparent text-[14.5px] text-[#171717] dark:text-[#F5F5F5] placeholder:text-neutral-400 focus:outline-none resize-none py-1.5 leading-normal"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-[#171717] dark:bg-[#F5F5F5] text-white dark:text-[#171717] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Send query"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.4]" />
            </button>
          </div>
          <div className="flex items-center justify-between px-2 pt-1.5 text-[10.5px] text-neutral-400 dark:text-neutral-500">
            <span>Miu Assistant Engine</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
