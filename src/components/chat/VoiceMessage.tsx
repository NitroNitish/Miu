import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessageProps {
  duration?: number; // seconds
  isOutgoing?: boolean;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({ duration = 18, isOutgoing = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Fixed visual wave heights for a realistic audio waveform
  const waveformHeights = [
    25, 45, 75, 30, 85, 95, 60, 40, 70, 90, 50, 30, 65, 80, 100, 75, 55, 35, 60, 85, 40, 25,
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentDisplayTime = isPlaying
    ? formatTime(progress)
    : formatTime(duration);

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] max-w-[260px]">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
          isOutgoing
            ? 'bg-white/20 hover:bg-white/30 text-white dark:bg-black/20 dark:hover:bg-black/30 dark:text-[#111214]'
            : 'bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 text-neutral-800 dark:text-neutral-200'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform Visualization */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-[3px] h-7">
          {waveformHeights.map((h, i) => {
            const barProgress = (i / waveformHeights.length) * duration;
            const hasPlayed = isPlaying && progress >= barProgress;

            return (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isOutgoing
                    ? hasPlayed
                      ? 'bg-white dark:bg-[#111214]'
                      : 'bg-white/40 dark:bg-[#111214]/30'
                    : hasPlayed
                    ? 'bg-[#A99BCB] dark:bg-[#B6A4DC]'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[11px] font-mono leading-none opacity-75">
          <span>{currentDisplayTime}</span>
        </div>
      </div>
    </div>
  );
};
