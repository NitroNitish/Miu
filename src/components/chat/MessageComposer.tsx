import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Image, Send, X, Trash2, Reply, AlertCircle } from 'lucide-react';
import { AttachmentSheet } from './AttachmentSheet';
import { Message } from '../../types';
import { useChat } from '../../context/ChatContext';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onSendMedia: (url: string, type: 'image' | 'video' | 'view_once', caption?: string) => void;
  onSendVoice: (audioData: { blob: Blob; url: string; duration: number }) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onSendMedia,
  onSendVoice,
  replyingTo,
  onCancelReply,
}) => {
  const { broadcastTyping, uploadMediaFile, partner } = useChat();

  const [text, setText] = useState('');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([30, 60, 45, 80, 50, 70, 40, 65, 55, 35]);
  const [micError, setMicError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordedSecondsRef = useRef<number>(0);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 130)}px`;
    }
  }, [text]);

  // Clean up recording tracks & audio context on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const cleanupRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    broadcastTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2500);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    broadcastTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // START RECORDING
  const startRecording = async () => {
    setMicError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      recordedSecondsRef.current = 0;
      setRecordingSeconds(0);

      // Supported MIME type detector
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg;codecs=opus',
      ];
      let chosenMime = '';
      if (typeof MediaRecorder !== 'undefined') {
        for (const type of preferredTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            chosenMime = type;
            break;
          }
        }
      }

      const recorder = new MediaRecorder(
        stream,
        chosenMime ? { mimeType: chosenMime } : undefined
      );

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // 100ms chunks

      setIsRecording(true);

      // Timer counter
      timerIntervalRef.current = setInterval(() => {
        recordedSecondsRef.current += 1;
        setRecordingSeconds(recordedSecondsRef.current);
      }, 1000);

      // Realtime Audio Visualizer
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevels = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              const bars: number[] = [];
              for (let i = 0; i < 11; i++) {
                const val = dataArray[i * 2] || 0;
                const percent = Math.min(100, Math.max(18, (val / 255) * 100));
                bars.push(percent);
              }
              setAudioLevels(bars);
              animFrameRef.current = requestAnimationFrame(updateAudioLevels);
            }
          };
          updateAudioLevels();
        }
      } catch (visErr) {
        console.warn('Audio visualization not supported:', visErr);
      }
    } catch (err: unknown) {
      console.error('Microphone access error:', err);
      const isPermissionDenied =
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setMicError(
        isPermissionDenied
          ? 'Microphone permission denied. Please allow microphone access.'
          : 'Could not access microphone.'
      );
      setTimeout(() => setMicError(null), 4000);
      cleanupRecording();
      setIsRecording(false);
    }
  };

  // CANCEL RECORDING
  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupRecording();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // SEND RECORDING
  const sendRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cancelRecording();
      return;
    }

    const duration = Math.max(1, recordedSecondsRef.current || recordingSeconds);

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });

      // Convert blob to base64 Data URL for zero-dependency universal playback
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSendVoice({
          blob: audioBlob,
          url: dataUrl,
          duration,
        });
      };
      reader.readAsDataURL(audioBlob);

      cleanupRecording();
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    try {
      recorder.stop();
    } catch {
      cleanupRecording();
      setIsRecording(false);
    }
  };

  const formatRecordTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');

    // Try Supabase Storage upload first
    const uploadedUrl = await uploadMediaFile(file, 'chat-media');
    if (uploadedUrl) {
      onSendMedia(uploadedUrl, isVideo ? 'video' : 'image', file.name);
      return;
    }

    // Local Base64 fallback if storage not configured
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSendMedia(reader.result, isVideo ? 'video' : 'image', file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="w-full bg-[#121212] border-t border-[#262626] relative z-20 select-none">
      {/* Hidden file inputs for Camera and Photo Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleMediaUpload}
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleMediaUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Mic Error Notice */}
      {micError && (
        <div className="px-4 py-2 bg-red-950/80 border-b border-red-800 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-[#262626] text-xs">
          <div className="flex items-center gap-2 text-neutral-300 truncate">
            <Reply className="w-3.5 h-3.5 text-[#3797F0] shrink-0" />
            <span className="text-[#8E8E8E] shrink-0">
              Replying to {replyingTo.sender === 'user' ? 'yourself' : partner.name}:
            </span>
            <span className="truncate italic text-white/90">"{replyingTo.content}"</span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Composer Row */}
      <div className="w-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2.5 max-w-full box-border">
        {isRecording ? (
          /* Live Voice Recording UI */
          <div className="flex-1 min-w-0 min-h-[44px] sm:min-h-[48px] flex items-center justify-between bg-[#262626] rounded-full px-4 py-2 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-sm font-mono font-medium text-white shrink-0">
                {formatRecordTime(recordingSeconds)}
              </span>

              {/* Dynamic Live Audio Level Waveform */}
              <div className="flex items-center gap-[3px] h-5 overflow-hidden ml-1">
                {audioLevels.map((val, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${val}%` }}
                    className="w-[2.5px] bg-[#B6A4DC] rounded-full transition-all duration-75"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 text-neutral-400 hover:text-red-400 active:scale-95 transition-all cursor-pointer rounded-full hover:bg-white/10"
                title="Cancel recording"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={sendRecording}
                className="px-4 py-1.5 rounded-full bg-[#B6A4DC] text-[#111214] font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Composer Row */
          <>
            {/* Left Camera Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              aria-label="Camera"
              className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full bg-[#3797F0] hover:bg-[#2884db] active:scale-95 text-white flex items-center justify-center shrink-0 transition-transform cursor-pointer shadow-sm"
            >
              <Camera className="w-[21px] h-[21px] sm:w-[22px] sm:h-[22px] stroke-[2]" />
            </button>

            {/* Middle Input Pill */}
            <div className="flex-1 min-w-0 min-h-[44px] sm:min-h-[48px] flex items-center bg-[#262626] rounded-full pl-4 pr-2.5 py-1 sm:py-1.5 border border-transparent focus-within:border-[#383838] transition-colors">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 min-w-0 bg-transparent text-[16px] sm:text-[17px] text-white placeholder-[#8E8E8E] focus:outline-none resize-none max-h-32 leading-[1.35] py-1"
              />

              {/* Inside Pill Right Icons */}
              {hasText ? (
                <button
                  type="button"
                  onClick={handleSend}
                  aria-label="Send"
                  className="ml-1 text-[#3797F0] hover:text-[#5aa9f3] text-[16px] sm:text-[17px] font-semibold active:scale-95 transition-all cursor-pointer px-2.5 py-1 shrink-0"
                >
                  Send
                </button>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2.5 text-white shrink-0 ml-1.5">
                  {/* Microphone (Start Voice Recording) */}
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label="Record voice note"
                    className="p-1 sm:p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer text-white"
                    title="Hold or tap to record voice note"
                  >
                    <Mic className="w-[21px] h-[21px] sm:w-[22px] sm:h-[22px] stroke-[1.8]" />
                  </button>

                  {/* Gallery */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    aria-label="Gallery photo"
                    className="p-1 sm:p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer text-white"
                    title="Send image"
                  >
                    <Image className="w-[21px] h-[21px] sm:w-[22px] sm:h-[22px] stroke-[1.8]" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Attachment Sheet */}
      <AttachmentSheet
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onSendMedia={onSendMedia}
      />
    </div>
  );
};

export default MessageComposer;
