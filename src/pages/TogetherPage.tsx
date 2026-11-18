import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, CircleHelp, ChevronRight } from 'lucide-react';

export const TogetherPage: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'doodle',
      title: 'Shared Doodle',
      description: 'Draw together on an interactive real-time canvas.',
      icon: Pencil,
      action: () => navigate('/doodle'),
      badge: 'Live canvas',
    },
    {
      id: 'daily-question',
      title: 'Daily Question',
      description: 'Today’s question. Reveal answers simultaneously.',
      icon: CircleHelp,
      action: () => navigate('/daily-question'),
      badge: 'Today',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pt">
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-[27px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
            miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
          </h1>
          <span className="text-[11px] text-[#777777] dark:text-[#999999] font-medium tracking-wider uppercase">
            Together
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-[23px] font-semibold text-[#171717] dark:text-[#F5F5F5] tracking-tight">
            Shared Space
          </h2>
          <p className="text-xs text-[#777777] dark:text-[#999999] mt-0.5">
            Synchronous moments reserved just for the two of you.
          </p>
        </div>

        {/* Clean two-column card layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={card.action}
                className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] hover:border-[#A99BCB]/60 dark:hover:border-[#B6A4DC]/60 transition-all cursor-pointer shadow-xs group min-h-[150px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-110 group-hover:bg-[#A99BCB]/15 group-hover:text-[#A99BCB] dark:group-hover:text-[#B6A4DC] transition-all">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5] group-hover:text-[#A99BCB] dark:group-hover:text-[#B6A4DC] transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-[#777777] dark:text-[#999999] mt-1 leading-snug">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
