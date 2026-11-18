import React, { useRef, useState } from 'react';
import { ArrowLeft, Check, Download, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DrawingCanvas, DrawingCanvasHandle } from '../components/doodle/DrawingCanvas';
import { DrawingToolbar } from '../components/doodle/DrawingToolbar';
import { IconButton } from '../components/common/IconButton';
import { Toast } from '../components/common/Toast';
import { useChat } from '../context/ChatContext';

export const DoodlePage: React.FC = () => {
  const navigate = useNavigate();
  const { sendDoodleToChat, saveDoodleToMemories } = useChat();

  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [color, setColor] = useState('#171717');
  const [brushSize, setBrushSize] = useState(6);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = () => {
    const dataUrl = canvasRef.current?.getCanvasData();
    if (!dataUrl) return;

    saveDoodleToMemories(dataUrl, 'Shared sketch');
    setToastMessage('Saved to Memories gallery');
  };

  const handleSend = () => {
    const dataUrl = canvasRef.current?.getCanvasData();
    if (!dataUrl) return;

    sendDoodleToChat(dataUrl);
    setToastMessage('Sent doodle to conversation');
    setTimeout(() => {
      navigate('/chat');
    }, 700);
  };

  const handleClear = () => {
    if (window.confirm('Clear the entire doodle canvas?')) {
      canvasRef.current?.clear();
    }
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-[#FAF9F7] dark:bg-[#111214] overflow-hidden">
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 dark:bg-[#191A1D]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-3 py-2.5 safe-pt flex items-center justify-between">
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
              Shared Doodle
            </h2>
            <p className="text-[11px] text-[#777777] dark:text-[#999999] leading-tight">
              Draw together in real-time
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </header>

      {/* Canvas Area */}
      <main className="flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        <DrawingCanvas
          ref={canvasRef}
          tool={tool}
          color={color}
          brushSize={brushSize}
          onHistoryChange={(undoable, redoable) => {
            setCanUndo(undoable);
            setCanRedo(redoable);
          }}
        />
      </main>

      {/* Toolbar */}
      <DrawingToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onClear={handleClear}
        onSend={handleSend}
        onSave={handleSave}
      />
    </div>
  );
};
