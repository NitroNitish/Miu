import React, { useState } from 'react';
import { Heart, Sparkles, Music, CloudSun, Send, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useChat } from '../../context/ChatContext';

interface QuickInteractionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const QuickInteractionsModal: React.FC<QuickInteractionsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { sendQuickInteraction } = useChat();
  const [pulseActive, setPulseActive] = useState(false);
  const [songTitle, setSongTitle] = useState('Nils Frahm – Says');

  const handlePulse = () => {
    setPulseActive(true);
    sendQuickInteraction('pulse');
    onShowToast('Sent gentle pulse');
    setTimeout(() => {
      setPulseActive(false);
      onClose();
    }, 900);
  };

  const handleNudge = () => {
    sendQuickInteraction('nudge');
    onShowToast('Sent "Thinking of you"');
    onClose();
  };

  const handleMusic = () => {
    sendQuickInteraction('music', { title: songTitle });
    onShowToast(`Shared track: ${songTitle}`);
    onClose();
  };

  const handleWeather = () => {
    sendQuickInteraction('weather', { temp: '21°C • Overcast skies' });
    onShowToast('Shared local weather');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Interactions">
      <div className="space-y-3">
        {/* Interaction 1: Heartbeat Pulse */}
        <button
          onClick={handlePulse}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-500 flex items-center justify-center transition-transform ${
                pulseActive ? 'scale-125' : 'group-hover:scale-105'
              }`}
            >
              <Heart className={`w-5 h-5 ${pulseActive ? 'fill-current animate-ping' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                Send Pulse
              </p>
              <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                A gentle haptic rhythm on their screen
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-[#A99BCB]">Send</span>
        </button>

        {/* Interaction 2: Thinking of you nudge */}
        <button
          onClick={handleNudge}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-[#A99BCB] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                Thinking of you
              </p>
              <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                Silent tap to let them know
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-[#A99BCB]">Tap</span>
        </button>

        {/* Interaction 3: Now Playing */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                Listening to
              </span>
            </div>
            <button
              onClick={handleMusic}
              className="text-xs font-medium text-[#A99BCB] hover:underline cursor-pointer"
            >
              Share
            </button>
          </div>
          <input
            type="text"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-[#171717] dark:text-neutral-200 focus:outline-none"
            placeholder="Artist — Song name"
          />
        </div>

        {/* Interaction 4: Weather exchange */}
        <button
          onClick={handleWeather}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                Share Sky & Weather
              </p>
              <p className="text-[11px] text-[#777777] dark:text-[#999999]">
                21°C • Overcast skies
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-[#A99BCB]">Share</span>
        </button>
      </div>
    </Modal>
  );
};
