import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessageProps {
  audioUrl?: string;
  duration?: number; // seconds
  isOutgoing?: boolean;
  messageId?: string;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  audioUrl,
  duration = 18,
  isOutgoing = false,
  messageId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [actualDuration, setActualDuration] = useState<number>(duration || 1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const instanceId = useRef(messageId || `voice-${Math.random().toString(36).slice(2, 8)}`);

  // Distinct visual wave heights for a realistic audio waveform
  const waveformHeights = [
    28, 48, 72, 35, 88, 95, 62, 44, 75, 92, 55, 32, 68, 82, 100, 78, 58, 38, 64, 88, 45, 30,
  ];

  // Initialize Audio element if audioUrl is provided
  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setActualDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Pause if another audio in the app starts playing
  useEffect(() => {
    const handleOtherAudioPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail?.id !== instanceId.current && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    };

    window.addEventListener('miu-audio-play', handleOtherAudioPlay);
    return () => window.removeEventListener('miu-audio-play', handleOtherAudioPlay);
  }, [isPlaying]);

  // Fallback timer simulation for messages without a real audioUrl (mock messages)
  useEffect(() => {
    if (audioUrl) return;

    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= actualDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5 * playbackRate;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, actualDuration, audioUrl, playbackRate]);

  const togglePlay = () => {
    if (!isPlaying) {
      // Broadcast to pause other players
      window.dispatchEvent(
        new CustomEvent('miu-audio-play', { detail: { id: instanceId.current } })
      );

      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play prevented or format unsupported, using visual progress:', err);
            setIsPlaying(true);
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (index: number) => {
    const fraction = index / waveformHeights.length;
    const targetTime = fraction * actualDuration;
    setProgress(targetTime);

    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentDisplayTime = isPlaying
    ? formatTime(progress)
    : formatTime(actualDuration);

  return (
    <div className="flex items-center gap-2.5 py-0.5 min-w-[195px] max-w-[250px] select-none">
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs ${
          isOutgoing
            ? 'bg-white/25 hover:bg-white/35 text-white dark:bg-black/25 dark:hover:bg-black/35 dark:text-[#111214]'
            : 'bg-[#A99BCB]/20 hover:bg-[#A99BCB]/30 text-[#826FB5] dark:bg-[#B6A4DC]/20 dark:hover:bg-[#B6A4DC]/30 dark:text-[#B6A4DC]'
        }`}
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform Visualization & Time Scrubbing */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-[2.5px] h-6 cursor-pointer" title="Scrub audio">
          {waveformHeights.map((h, i) => {
            const barProgress = (i / waveformHeights.length) * actualDuration;
            const hasPlayed = progress >= barProgress;
            const isCurrentHead =
              isPlaying &&
              progress >= barProgress &&
              progress < ((i + 1) / waveformHeights.length) * actualDuration;

            return (
              <span
                key={i}
                onClick={() => handleSeek(i)}
                style={{ height: `${h}%` }}
                className={`w-[2.5px] rounded-full transition-all duration-150 hover:opacity-100 ${
                  isCurrentHead ? 'scale-y-125' : ''
                } ${
                  isOutgoing
                    ? hasPlayed
                    ? 'bg-white dark:bg-[#111214]'
                    : 'bg-white/35 dark:bg-[#111214]/30'
                  : hasPlayed
                  ? 'bg-[#A99BCB] dark:bg-[#B6A4DC]'
                  : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            );
          })}
        </div>

        {/* Time display & Speed toggle */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none opacity-80">
          <span>{currentDisplayTime}</span>

          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold tracking-tight hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;
