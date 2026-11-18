import React, { useState } from 'react';
import { ArrowLeft, CircleHelp, Check, Sparkles, Lock, MessageCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '../components/common/IconButton';
import { Toast } from '../components/common/Toast';
import { useChat } from '../context/ChatContext';
import { Avatar } from '../components/common/Avatar';

export const DailyQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const { dailyQuestions, answerDailyQuestion, partner, user } = useChat();

  const [inputAnswer, setInputAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Today's question is the first item
  const todayQuestion = dailyQuestions[0];
  const previousQuestions = dailyQuestions.slice(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      answerDailyQuestion(todayQuestion.id, inputAnswer.trim());
      setIsSubmitting(false);
      setToastMessage('Answer unlocked! Both answers revealed.');
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] pb-24 md:pb-8">
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-3 py-2.5 safe-pt flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="text-neutral-700 dark:text-neutral-300"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </IconButton>
          <div>
            <h2 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5] leading-tight">
              Daily Question
            </h2>
            <p className="text-[11px] text-[#777777] dark:text-[#999999] leading-tight">
              One question, two answers
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Today's Question Card */}
        <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl p-5 sm:p-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#A99BCB] dark:text-[#B6A4DC] uppercase tracking-wider flex items-center gap-1.5">
              <CircleHelp className="w-3.5 h-3.5" />
              <span>{todayQuestion.date}</span>
            </span>
            <span className="text-[11px] text-[#777777] dark:text-[#999999]">
              {todayQuestion.category}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#171717] dark:text-[#F5F5F5] leading-snug mb-5">
            "{todayQuestion.question}"
          </h3>

          {/* If revealed / already answered */}
          {todayQuestion.isRevealed ? (
            <div className="space-y-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              {/* User Answer Card */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                    Your Answer
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed pl-1">
                  {todayQuestion.userAnswer}
                </p>
              </div>

              {/* Partner Answer Card */}
              <div className="bg-[#A99BCB]/10 dark:bg-[#B6A4DC]/10 rounded-xl p-4 border border-[#A99BCB]/30 dark:border-[#B6A4DC]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={partner.avatar} name={partner.name} size="sm" showOnline />
                  <span className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                    {partner.name}'s Answer
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed pl-1">
                  {todayQuestion.partnerAnswer}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-1.5 text-xs text-[#A99BCB] dark:text-[#B6A4DC] font-medium hover:underline cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Discuss in Chat</span>
                </button>
              </div>
            </div>
          ) : (
            /* Input Form to unlock */
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  placeholder="Type your answer... (Answers reveal simultaneously once you submit)"
                  rows={4}
                  className="w-full bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-[#171717] dark:text-[#F5F5F5] placeholder-neutral-400 focus:outline-none focus:border-[#A99BCB] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!inputAnswer.trim() || isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#202124] text-white dark:bg-[#B6A4DC] dark:text-[#111214] text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Revealing answers...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit & Reveal Answers</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Elena has already submitted her response.</span>
              </p>
            </form>
          )}
        </div>

        {/* Previous Answered Questions */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Previous Questions
          </h4>

          {previousQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-400">{q.date}</span>
                <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-500">
                  {q.category}
                </span>
              </div>
              <h5 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5]">
                "{q.question}"
              </h5>

              <div className="space-y-2 text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300 w-12 shrink-0">
                    You:
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 italic">
                    "{q.userAnswer}"
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-[#A99BCB] dark:text-[#B6A4DC] w-12 shrink-0">
                    {partner.name}:
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400 italic">
                    "{q.partnerAnswer}"
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
