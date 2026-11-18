import React from 'react';
import { ArrowLeft, Swords, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '../components/common/IconButton';
import { TicTacToeGame } from '../components/games/TicTacToeGame';

export const TicTacToePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] text-[#171717] dark:text-[#F5F5F5] pb-16 md:pb-8 transition-colors select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pt flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <IconButton
            size="sm"
            variant="ghost"
            onClick={() => navigate('/together')}
            aria-label="Back to Together"
            className="text-neutral-700 dark:text-neutral-300"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </IconButton>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-[#171717] dark:text-[#F5F5F5] leading-tight tracking-tight">
                X & 0
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#A99BCB]/15 text-[#826FB5] dark:text-[#B6A4DC] text-[10px] font-bold tracking-wider uppercase">
                Tic-Tac-Toe
              </span>
            </div>
            <p className="text-[11px] text-[#777777] dark:text-[#999999] leading-tight">
              Synchronous 2-player space
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#8C867E] dark:text-[#999999]">
          <Sparkles className="w-3.5 h-3.5 text-[#A99BCB] dark:text-[#B6A4DC]" />
          <span className="font-medium hidden sm:inline">Play Together</span>
        </div>
      </header>

      {/* Main Game Container */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <TicTacToeGame />
      </main>
    </div>
  );
};

export default TicTacToePage;
