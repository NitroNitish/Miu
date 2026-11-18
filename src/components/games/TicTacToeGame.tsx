import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../utils/soundEffects';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Smartphone,
  Bot,
  Sparkles,
  Trophy,
  Share2,
  Heart,
  Send,
} from 'lucide-react';

export type GameMode = 'partner' | 'pass' | 'ai';
export type AIDifficulty = 'easy' | 'smart' | 'unbeatable';

interface WinningResult {
  winner: 'X' | 'O' | 'draw' | null;
  line: number[] | null;
}

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Array<'X' | 'O' | null>): WinningResult {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: 'draw', line: null };
  }
  return { winner: null, line: null };
}

// Minimax algorithm for smart & unbeatable AI
function minimax(
  tempBoard: Array<'X' | 'O' | null>,
  depth: number,
  isMaximizing: boolean
): { score: number; index?: number } {
  const result = checkWinner(tempBoard);
  if (result.winner === 'O') return { score: 10 - depth };
  if (result.winner === 'X') return { score: depth - 10 };
  if (result.winner === 'draw') return { score: 0 };

  const emptyIndices = tempBoard
    .map((val, idx) => (val === null ? idx : null))
    .filter((v): v is number => v !== null);

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];
    for (const idx of emptyIndices) {
      tempBoard[idx] = 'O';
      const evalResult = minimax(tempBoard, depth + 1, false);
      tempBoard[idx] = null;
      if (evalResult.score > bestScore) {
        bestScore = evalResult.score;
        bestMove = idx;
      }
    }
    return { score: bestScore, index: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove = emptyIndices[0];
    for (const idx of emptyIndices) {
      tempBoard[idx] = 'X';
      const evalResult = minimax(tempBoard, depth + 1, true);
      tempBoard[idx] = null;
      if (evalResult.score < bestScore) {
        bestScore = evalResult.score;
        bestMove = idx;
      }
    }
    return { score: bestScore, index: bestMove };
  }
}

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
}

export const TicTacToeGame: React.FC = () => {
  const { user, connection, partner } = useAuth();
  const { sendMessage } = useChat();

  const [board, setBoard] = useState<Array<'X' | 'O' | null>>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [startingPlayer, setStartingPlayer] = useState<'X' | 'O'>('X');
  const [mode, setMode] = useState<GameMode>(connection ? 'partner' : 'pass');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('smart');
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Scores
  const [scores, setScores] = useState<{ x: number; o: number; draws: number }>(() => {
    const saved = localStorage.getItem('miu_ttt_scores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return { x: 0, o: 0, draws: 0 };
  });

  const winResult = checkWinner(board);
  const isGameOver = winResult.winner !== null;

  // In partner mode, determine assigned symbol:
  // Connection creator (user_one_id) is X, partner is O
  const mySymbol: 'X' | 'O' = connection
    ? user?.id === connection.user_one_id
      ? 'X'
      : 'O'
    : 'X';

  const isMyTurn = mode === 'partner' ? turn === mySymbol : true;

  // Persist scores
  useEffect(() => {
    localStorage.setItem('miu_ttt_scores', JSON.stringify(scores));
  }, [scores]);

  // Handle Game Win / Tie sounds
  useEffect(() => {
    if (winResult.winner === 'X' || winResult.winner === 'O') {
      sounds.playWin();
    } else if (winResult.winner === 'draw') {
      sounds.playTie();
    }
  }, [winResult.winner]);

  // Realtime Broadcast Channel for 2-Player Online Mode
  const conversationId = connection?.conversation_id;
  useEffect(() => {
    if (mode !== 'partner' || !isSupabaseConfigured || !conversationId) return;

    const channel = supabase.channel(`game_ttt_${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'game_move' }, (payload) => {
        const { cellIndex, player, nextTurn } = payload.payload;
        setBoard((prev) => {
          if (prev[cellIndex] !== null) return prev;
          const nextBoard = [...prev];
          nextBoard[cellIndex] = player;
          return nextBoard;
        });
        sounds.playPlace(player);
        setTurn(nextTurn);
      })
      .on('broadcast', { event: 'game_reset' }, (payload) => {
        const { nextStarter } = payload.payload;
        setBoard(Array(9).fill(null));
        setTurn(nextStarter);
        setStartingPlayer(nextStarter);
        sounds.playPop();
      })
      .on('broadcast', { event: 'game_reaction' }, (payload) => {
        const { emoji } = payload.payload;
        triggerFloatingReaction(emoji);
        sounds.playPop();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, conversationId]);

  // Broadcast move
  const broadcastMove = (cellIndex: number, player: 'X' | 'O', nextTurn: 'X' | 'O') => {
    if (mode !== 'partner' || !isSupabaseConfigured || !conversationId) return;
    const channel = supabase.channel(`game_ttt_${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'game_move',
      payload: { cellIndex, player, nextTurn },
    });
  };

  // Broadcast reset
  const broadcastReset = (nextStarter: 'X' | 'O') => {
    if (mode !== 'partner' || !isSupabaseConfigured || !conversationId) return;
    const channel = supabase.channel(`game_ttt_${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'game_reset',
      payload: { nextStarter },
    });
  };

  // Broadcast reaction
  const broadcastReaction = (emoji: string) => {
    triggerFloatingReaction(emoji);
    sounds.playPop();

    if (mode === 'partner' && isSupabaseConfigured && conversationId) {
      const channel = supabase.channel(`game_ttt_${conversationId}`);
      channel.send({
        type: 'broadcast',
        event: 'game_reaction',
        payload: { emoji },
      });
    }
  };

  const triggerFloatingReaction = (emoji: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    const left = Math.floor(Math.random() * 70) + 15;
    setReactions((prev) => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  // Make move
  const handleCellClick = (index: number) => {
    if (board[index] !== null || isGameOver) return;
    if (mode === 'partner' && !isMyTurn) return;
    if (mode === 'ai' && isAiThinking) return;

    sounds.playPlace(turn);
    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    const check = checkWinner(newBoard);
    if (check.winner === 'X') {
      setScores((s) => ({ ...s, x: s.x + 1 }));
    } else if (check.winner === 'O') {
      setScores((s) => ({ ...s, o: s.o + 1 }));
    } else if (check.winner === 'draw') {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
    }

    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);

    if (mode === 'partner') {
      broadcastMove(index, turn, nextTurn);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || isGameOver) return;

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const emptyIndices = board
        .map((val, idx) => (val === null ? idx : null))
        .filter((v): v is number => v !== null);

      if (emptyIndices.length === 0) {
        setIsAiThinking(false);
        return;
      }

      let chosenIndex: number;

      if (difficulty === 'easy') {
        // Random choice with 30% winning chance
        chosenIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      } else if (difficulty === 'smart') {
        // 70% minimax, 30% random
        if (Math.random() < 0.7) {
          const move = minimax([...board], 0, true);
          chosenIndex = move.index !== undefined ? move.index : emptyIndices[0];
        } else {
          chosenIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }
      } else {
        // Unbeatable
        const move = minimax([...board], 0, true);
        chosenIndex = move.index !== undefined ? move.index : emptyIndices[0];
      }

      sounds.playPlace('O');
      const newBoard = [...board];
      newBoard[chosenIndex] = 'O';
      setBoard(newBoard);

      const check = checkWinner(newBoard);
      if (check.winner === 'X') {
        setScores((s) => ({ ...s, x: s.x + 1 }));
      } else if (check.winner === 'O') {
        setScores((s) => ({ ...s, o: s.o + 1 }));
      } else if (check.winner === 'draw') {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      }

      setTurn('X');
      setIsAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [turn, mode, board, isGameOver, difficulty]);

  // Restart Round
  const handleResetGame = () => {
    const nextStarter = startingPlayer === 'X' ? 'O' : 'X';
    setBoard(Array(9).fill(null));
    setTurn(nextStarter);
    setStartingPlayer(nextStarter);
    sounds.playPop();

    if (mode === 'partner') {
      broadcastReset(nextStarter);
    }
  };

  const handleResetScores = () => {
    if (window.confirm('Reset scoreboard back to 0 - 0?')) {
      setScores({ x: 0, o: 0, draws: 0 });
      sounds.playPop();
    }
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Share game result or invite to chat
  const handleShareToChat = async () => {
    let text = '';
    if (winResult.winner === 'X') {
      text = `🎮 Tic-Tac-Toe: ${user?.display_name || 'You'} won! Score: ${scores.x} - ${scores.o}. Ready for another round?`;
    } else if (winResult.winner === 'O') {
      text = `🎮 Tic-Tac-Toe: ${partner.name} won! Score: ${scores.x} - ${scores.o}. Game on!`;
    } else if (winResult.winner === 'draw') {
      text = `🎮 Tic-Tac-Toe: Tied game! Perfectly matched. Score: ${scores.x} - ${scores.o}.`;
    } else {
      text = `🎮 Let's play Tic-Tac-Toe together on Miu! I'm waiting on the board.`;
    }

    await sendMessage({ content: text, type: 'text' });
    setStatusMessage('Result shared to conversation!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Calculate coordinates for SVG winning line
  const getWinningLineCoordinates = (line: number[]) => {
    // 300x300 viewBox, center points:
    // col 0: 50, col 1: 150, col 2: 250
    // row 0: 50, row 1: 150, row 2: 250
    const coords: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
      '0,1,2': { x1: 20, y1: 50, x2: 280, y2: 50 },
      '3,4,5': { x1: 20, y1: 150, x2: 280, y2: 150 },
      '6,7,8': { x1: 20, y1: 250, x2: 280, y2: 250 },
      '0,3,6': { x1: 50, y1: 20, x2: 50, y2: 280 },
      '1,4,7': { x1: 150, y1: 20, x2: 150, y2: 280 },
      '2,5,8': { x1: 250, y1: 20, x2: 250, y2: 280 },
      '0,4,8': { x1: 25, y1: 25, x2: 275, y2: 275 },
      '2,4,6': { x1: 275, y1: 25, x2: 25, y2: 275 },
    };
    return coords[line.join(',')];
  };

  const lineCoords = winResult.line ? getWinningLineCoordinates(winResult.line) : null;

  return (
    <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="absolute -top-12 z-50 px-4 py-2 rounded-full bg-[#1E1F24] dark:bg-[#B6A4DC] text-white dark:text-[#111214] text-xs font-semibold shadow-lg animate-fade-in flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Floating Reactions Container */}
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
        {reactions.map((r) => (
          <span
            key={r.id}
            style={{ left: `${r.left}%` }}
            className="absolute bottom-16 text-3xl animate-float-up select-none"
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Mode Selector Tabs */}
      <div className="w-full flex items-center justify-between gap-1 p-1 bg-[#F0EDE8] dark:bg-[#1E1F24] rounded-2xl mb-4 border border-[#EAE5DE] dark:border-[#303136]">
        <button
          type="button"
          onClick={() => {
            setMode('partner');
            setBoard(Array(9).fill(null));
          }}
          disabled={!connection}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'partner'
              ? 'bg-white dark:bg-[#2A2B30] text-[#171717] dark:text-[#F5F5F5] shadow-xs'
              : 'text-[#777777] dark:text-[#999999] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
          } ${!connection ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={connection ? 'Play live with partner' : 'Pair with partner to play online'}
        >
          <Users className="w-3.5 h-3.5 stroke-[2]" />
          <span>Live Partner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('pass');
            setBoard(Array(9).fill(null));
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'pass'
              ? 'bg-white dark:bg-[#2A2B30] text-[#171717] dark:text-[#F5F5F5] shadow-xs'
              : 'text-[#777777] dark:text-[#999999] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 stroke-[2]" />
          <span>Pass & Play</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('ai');
            setBoard(Array(9).fill(null));
          }}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            mode === 'ai'
              ? 'bg-white dark:bg-[#2A2B30] text-[#171717] dark:text-[#F5F5F5] shadow-xs'
              : 'text-[#777777] dark:text-[#999999] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 stroke-[2]" />
          <span>Miu AI</span>
        </button>
      </div>

      {/* AI Difficulty Selector (if in AI mode) */}
      {mode === 'ai' && (
        <div className="w-full flex items-center justify-center gap-2 mb-3 animate-fade-in text-xs text-[#777777] dark:text-[#999999]">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Difficulty:</span>
          {(['easy', 'smart', 'unbeatable'] as AIDifficulty[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setDifficulty(lvl);
                setBoard(Array(9).fill(null));
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                difficulty === lvl
                  ? 'bg-[#A99BCB]/20 dark:bg-[#B6A4DC]/20 text-[#826FB5] dark:text-[#B6A4DC] font-semibold'
                  : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Scoreboard Card */}
      <div className="w-full bg-white dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-2xl p-3.5 shadow-xs mb-4 flex items-center justify-between">
        {/* Player X Info */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform ${
              turn === 'X' && !isGameOver
                ? 'ring-2 ring-[#A99BCB] scale-105 bg-[#A99BCB]/15 text-[#826FB5] dark:text-[#B6A4DC]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            ✕
          </div>
          <div>
            <p className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5] leading-tight">
              {mode === 'pass'
                ? 'Player 1'
                : mode === 'ai'
                ? 'You'
                : user?.display_name || 'You'}
            </p>
            <p className="text-[11px] text-[#A99BCB] dark:text-[#B6A4DC] font-semibold">
              {scores.x} wins
            </p>
          </div>
        </div>

        {/* Ties & Divider */}
        <div className="text-center px-2">
          <p className="text-[11px] text-[#8C867E] dark:text-[#999999] uppercase tracking-wider font-medium">
            Ties
          </p>
          <p className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5]">{scores.draws}</p>
        </div>

        {/* Player O Info */}
        <div className="flex items-center gap-2.5 flex-row-reverse text-right">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-transform ${
              turn === 'O' && !isGameOver
                ? 'ring-2 ring-[#E29578] scale-105 bg-[#E29578]/15 text-[#E29578]'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            ◯
          </div>
          <div>
            <p className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5] leading-tight">
              {mode === 'pass'
                ? 'Player 2'
                : mode === 'ai'
                ? 'Miu AI'
                : partner.name || 'Partner'}
            </p>
            <p className="text-[11px] text-[#E29578] font-semibold">{scores.o} wins</p>
          </div>
        </div>
      </div>

      {/* Turn & Status Indicator Banner */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 text-xs">
          {isGameOver ? (
            <div className="flex items-center gap-1.5 font-bold text-[#171717] dark:text-[#F5F5F5]">
              <Trophy className="w-4 h-4 text-[#A99BCB] dark:text-[#B6A4DC]" />
              <span>
                {winResult.winner === 'draw'
                  ? 'Match Drawn!'
                  : winResult.winner === 'X'
                  ? `${mode === 'pass' ? 'Player 1' : 'X'} Takes The Crown!`
                  : `${mode === 'pass' ? 'Player 2' : 'O'} Takes The Crown!`}
              </span>
            </div>
          ) : isAiThinking ? (
            <div className="flex items-center gap-1.5 text-[#E29578] font-medium animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Miu is thinking...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  turn === 'X'
                    ? 'bg-[#A99BCB] dark:bg-[#B6A4DC] shadow-[0_0_8px_rgba(182,164,220,0.8)]'
                    : 'bg-[#E29578] shadow-[0_0_8px_rgba(226,149,120,0.8)]'
                }`}
              />
              <span className="font-semibold text-[#171717] dark:text-[#F5F5F5]">
                {mode === 'partner'
                  ? isMyTurn
                    ? `Your Turn (${turn})`
                    : `Waiting for ${partner.name}...`
                  : mode === 'pass'
                  ? `Player ${turn === 'X' ? '1 (X)' : '2 (O)'}'s Turn`
                  : turn === 'X'
                  ? 'Your Turn (X)'
                  : 'Miu AI (O)'}
              </span>
            </div>
          )}
        </div>

        {/* Sound toggle & score reset */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleResetScores}
            className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 px-2 py-1 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Reset score"
          >
            Reset
          </button>
        </div>
      </div>

      {/* The 3x3 Game Board */}
      <div className="relative w-full aspect-square bg-white dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-3xl p-3 shadow-md">
        {/* Background Grid Lines */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-full h-full">
          {board.map((cellValue, idx) => {
            const isWinningCell = winResult.line?.includes(idx);
            const canClick =
              cellValue === null &&
              !isGameOver &&
              (mode !== 'partner' || isMyTurn) &&
              (mode !== 'ai' || !isAiThinking);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCellClick(idx)}
                disabled={!canClick}
                className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 select-none ${
                  cellValue === null
                    ? canClick
                      ? 'bg-[#FAF9F7] dark:bg-[#232428] hover:bg-[#F2EFE9] dark:hover:bg-[#2A2B30] active:scale-95 cursor-pointer'
                      : 'bg-[#FAF9F7]/70 dark:bg-[#232428]/60 cursor-default'
                    : isWinningCell
                    ? cellValue === 'X'
                      ? 'bg-[#A99BCB]/25 dark:bg-[#B6A4DC]/30 ring-2 ring-[#A99BCB] dark:ring-[#B6A4DC] shadow-[0_0_20px_rgba(182,164,220,0.5)]'
                      : 'bg-[#E29578]/25 dark:bg-[#E29578]/30 ring-2 ring-[#E29578] shadow-[0_0_20px_rgba(226,149,120,0.5)]'
                    : 'bg-[#FAF9F7] dark:bg-[#232428]'
                }`}
              >
                {cellValue === 'X' && (
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 sm:w-16 sm:h-16 text-[#826FB5] dark:text-[#B6A4DC] drop-shadow-sm transition-transform animate-scale-in"
                  >
                    <line
                      x1="26"
                      y1="26"
                      x2="74"
                      y2="74"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                    <line
                      x1="74"
                      y1="26"
                      x2="26"
                      y2="74"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {cellValue === 'O' && (
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 sm:w-16 sm:h-16 text-[#E29578] drop-shadow-sm transition-transform animate-scale-in"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="26"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* Subtle hover mark preview on empty cell */}
                {cellValue === null && canClick && (
                  <span className="opacity-0 hover:opacity-20 text-3xl font-light text-neutral-400 dark:text-neutral-500 transition-opacity">
                    {turn}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SVG Strike-through Winning Line */}
        {lineCoords && (
          <svg className="pointer-events-none absolute inset-0 w-full h-full p-3 z-10">
            <line
              x1={`${(lineCoords.x1 / 300) * 100}%`}
              y1={`${(lineCoords.y1 / 300) * 100}%`}
              x2={`${(lineCoords.x2 / 300) * 100}%`}
              y2={`${(lineCoords.y2 / 300) * 100}%`}
              stroke={winResult.winner === 'X' ? '#B6A4DC' : '#E29578'}
              strokeWidth="7"
              strokeLinecap="round"
              className="drop-shadow-[0_0_12px_rgba(182,164,220,0.9)] animate-draw-line"
            />
          </svg>
        )}
      </div>

      {/* Floating Reaction Bar (Quick fun emojis for couple) */}
      <div className="w-full flex items-center justify-center gap-2.5 mt-3 pt-1">
        {['❤️', '✨', '🥺', '👏', '🙈', '🔥'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => broadcastReaction(emoji)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] text-lg hover:scale-115 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center"
            title={`Send ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Bottom Controls: New Round & Share to Chat */}
      <div className="w-full flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleResetGame}
          className="flex-1 h-12 rounded-2xl bg-[#1E1F24] dark:bg-[#B6A4DC] text-white dark:text-[#111214] font-semibold text-xs sm:text-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.2]" />
          <span>{isGameOver ? 'Play Next Round' : 'Restart Board'}</span>
        </button>

        {connection && (
          <button
            type="button"
            onClick={handleShareToChat}
            className="h-12 px-4 rounded-2xl border border-[#EEEEEC] dark:border-[#303136] bg-white dark:bg-[#191A1D] text-[#171717] dark:text-[#F5F5F5] font-semibold text-xs hover:border-[#A99BCB] dark:hover:border-[#B6A4DC] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            title="Share score or invite to chat"
          >
            <Share2 className="w-4 h-4 text-[#A99BCB] dark:text-[#B6A4DC]" />
            <span className="hidden sm:inline">Share to Chat</span>
          </button>
        )}
      </div>

      {/* Footnote */}
      <p className="text-[11px] text-[#8C867E] dark:text-[#999999] text-center mt-3">
        {mode === 'partner'
          ? `Connected with ${partner.name}. Real-time synchronization active.`
          : mode === 'pass'
          ? 'Pass the device between each move to play side-by-side.'
          : 'Playing against Miu AI. Practice your moves anytime.'}
      </p>
    </div>
  );
};

export default TicTacToeGame;
