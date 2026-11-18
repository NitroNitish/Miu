import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Shield } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const CallModal: React.FC = () => {
  const { callState, endCall, partner } = useChat();
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState.isInCall) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isInCall]);

  if (!callState.isInCall) return null;

  const formatTimer = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isVideoCall = callState.type === 'video' && !isVideoDisabled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white animate-fade-in backdrop-blur-md">
      {/* Background or video feed */}
      {isVideoCall ? (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85"
            alt="Video Feed"
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

          {/* User Self Camera PIP */}
          <div className="absolute top-6 right-6 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-neutral-900">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
              alt="Self preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-[#111214] flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#A99BCB]/20 animate-ping" />
            <Avatar src={partner.avatar} name={partner.name} size="xl" />
          </div>
          <h3 className="text-xl font-bold mb-1">{partner.name}</h3>
          <p className="text-xs text-neutral-400 mb-2">Encrypted Voice Call</p>
          <div className="flex items-center gap-1.5 text-xs text-[#35B779] bg-[#35B779]/10 px-3 py-1 rounded-full border border-[#35B779]/20">
            <Shield className="w-3.5 h-3.5" />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      )}

      {/* Top Header info */}
      <div className="absolute top-6 left-6 z-20 flex flex-col">
        <span className="text-sm font-semibold">{partner.name}</span>
        <span className="text-xs text-white/80 font-mono">{formatTimer(seconds)}</span>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-white/10 backdrop-blur-lg px-6 py-3.5 rounded-full border border-white/20 shadow-2xl">
        {/* Mute Mic */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoDisabled(!isVideoDisabled)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoDisabled ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title={isVideoDisabled ? 'Turn video on' : 'Turn video off'}
        >
          {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            !isSpeakerOn ? 'bg-white/10 text-white/50' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
          title="Toggle speaker"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
