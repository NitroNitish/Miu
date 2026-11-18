import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, Image, Send, X, Trash2, Reply } from 'lucide-react';
import { AttachmentSheet } from './AttachmentSheet';
import { Message } from '../../types';
import { useChat } from '../../context/ChatContext';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onSendMedia: (url: string, type: 'image' | 'video' | 'view_once', caption?: string) => void;
  onSendVoice: (duration: number) => void;
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 130)}px`;
    }
  }, [text]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

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

  const startRecording = () => {
    setIsRecording(true);
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  const sendRecording = () => {
    const finalDuration = Math.max(recordingSeconds, 2);
    setIsRecording(false);
    onSendVoice(finalDuration);
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

    // Fallback to base64 DataURL
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
    <footer className="shrink-0 w-full bg-[#000000] border-t border-[#1A1A1A] z-50 box-border pt-1 pb-[max(8px,env(safe-area-inset-bottom,8px))]">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleMediaUpload}
        accept="image/*"
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

      {/* Replying banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1A1A1A] border-b border-[#262626] text-xs">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <Reply className="w-3.5 h-3.5 text-[#D91A8E] shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-neutral-300">
                Replying to {replyingTo.sender === 'user' ? 'yourself' : partner.name}:
              </span>{' '}
              <span className="text-neutral-500 truncate">
                {replyingTo.content || 'Media message'}
              </span>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Composer Row - Comfortably sized, sleek layout with Camera, Message Pill, Mic & Gallery */}
      <div className="w-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2.5 max-w-full box-border">
        {isRecording ? (
          /* Voice Recording Mode UI */
          <div className="flex-1 min-w-0 min-h-[44px] sm:min-h-[48px] flex items-center justify-between bg-[#262626] rounded-full px-4 py-2 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-sm font-mono font-medium text-white shrink-0">
                {formatRecordTime(recordingSeconds)}
              </span>
              <div className="hidden xs:flex items-center gap-0.5 h-4 overflow-hidden">
                {[40, 80, 50, 90, 70, 30, 60, 100, 45, 75, 35].map((val, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${val}%` }}
                    className="w-[2px] bg-red-500/80 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={cancelRecording}
                className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Cancel recording"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={sendRecording}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#D91A8E] to-[#6366F1] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Composer Row */
          <>
            {/* Left Camera Button: Circular blue button (comfortable 42px - 44px) */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              aria-label="Camera"
              className="w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-full bg-[#3797F0] hover:bg-[#2884db] active:scale-95 text-white flex items-center justify-center shrink-0 transition-transform cursor-pointer shadow-sm"
            >
              <Camera className="w-[21px] h-[21px] sm:w-[22px] sm:h-[22px] stroke-[2]" />
            </button>

            {/* Middle Input Pill: Comfortably sized with 16px-17px font */}
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
                  {/* Microphone */}
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label="Voice message"
                    className="p-1 sm:p-1.5 hover:opacity-80 active:scale-95 transition-all cursor-pointer text-white"
                    title="Voice message"
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
    </footer>
  );
};
