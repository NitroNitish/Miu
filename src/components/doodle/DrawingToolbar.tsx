import React from 'react';
import { Pencil, Eraser, RotateCcw, RotateCw, Trash2, Send, Download } from 'lucide-react';
import { IconButton } from '../common/IconButton';

interface DrawingToolbarProps {
  tool: 'pencil' | 'eraser';
  setTool: (tool: 'pencil' | 'eraser') => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSend: () => void;
  onSave: () => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSend,
  onSave,
}) => {
  const palette = [
    '#171717', // Dark/Black
    '#A99BCB', // Brand Accent Lavender
    '#E07A5F', // Warm Terracotta
    '#81B29A', // Sage Green
    '#F2CC8F', // Warm Amber
    '#3D5A80', // Slate Blue
    '#FFFFFF', // White
  ];

  const brushSizes = [
    { label: 'S', size: 3 },
    { label: 'M', size: 6 },
    { label: 'L', size: 12 },
  ];

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#191A1D] border-t border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pb">
      <div className="max-w-xl mx-auto flex flex-col gap-3">
        {/* Colors and Brush Sizes Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Color palette dots */}
          <div className="flex items-center gap-2">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool('pencil');
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-600 transition-transform cursor-pointer ${
                  color === c && tool === 'pencil' ? 'scale-125 ring-2 ring-offset-2 ring-[#A99BCB]' : 'hover:scale-110'
                }`}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {brushSizes.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushSize(b.size)}
                className={`w-6 h-6 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                  brushSize === b.size
                    ? 'bg-white dark:bg-[#191A1D] text-[#171717] dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools and Actions Row */}
        <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
          {/* Tool selectors (pencil vs eraser) */}
          <div className="flex items-center gap-1.5">
            <IconButton
              size="sm"
              variant={tool === 'pencil' ? 'secondary' : 'ghost'}
              active={tool === 'pencil'}
              onClick={() => setTool('pencil')}
              aria-label="Pencil tool"
            >
              <Pencil className="w-4 h-4" />
            </IconButton>

            <IconButton
              size="sm"
              variant={tool === 'eraser' ? 'secondary' : 'ghost'}
              active={tool === 'eraser'}
              onClick={() => setTool('eraser')}
              aria-label="Eraser tool"
            >
              <Eraser className="w-4 h-4" />
            </IconButton>

            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            {/* Undo / Redo */}
            <IconButton
              size="sm"
              variant="ghost"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </IconButton>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </IconButton>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={onClear}
              aria-label="Clear canvas"
              className="hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Action buttons (Save & Send) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={onSend}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#202124] text-white dark:bg-[#B6A4DC] dark:text-[#111214] text-xs font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
