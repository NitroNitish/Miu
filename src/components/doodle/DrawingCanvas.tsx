import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface DrawingCanvasHandle {
  getCanvasData: () => string;
  clear: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface DrawingCanvasProps {
  tool: 'pencil' | 'eraser';
  color: string;
  brushSize: number;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ tool, color, brushSize, onHistoryChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);

    // Sync history state with parent
    useEffect(() => {
      onHistoryChange?.(historyIndex > 0, historyIndex < history.length - 1);
    }, [historyIndex, history.length, onHistoryChange]);

    // Initial canvas setup
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw initial subtle smiley sketch as shown in the mockup image!
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);

        // Draw a cute minimal smiley + heart as in the mockup screenshot!
        ctx.strokeStyle = '#171717';
        ctx.lineWidth = 4;

        // Face circle
        ctx.beginPath();
        ctx.arc(rect.width * 0.45, rect.height * 0.45, 45, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#171717';
        ctx.beginPath();
        ctx.arc(rect.width * 0.45 - 15, rect.height * 0.45 - 10, 4, 0, Math.PI * 2);
        ctx.arc(rect.width * 0.45 + 15, rect.height * 0.45 - 10, 4, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(rect.width * 0.45, rect.height * 0.45 + 5, 22, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Little heart next to it
        ctx.beginPath();
        const hx = rect.width * 0.45 + 65;
        const hy = rect.height * 0.45 - 5;
        ctx.moveTo(hx, hy + 8);
        ctx.bezierCurveTo(hx, hy, hx - 12, hy - 12, hx - 12, hy + 8);
        ctx.bezierCurveTo(hx - 12, hy + 20, hx, hy + 28, hx, hy + 32);
        ctx.bezierCurveTo(hx, hy + 28, hx + 12, hy + 20, hx + 12, hy + 8);
        ctx.bezierCurveTo(hx + 12, hy - 12, hx, hy, hx, hy + 8);
        ctx.stroke();

        // Save initial state to history
        const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    }, []);

    const saveState = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    };

    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);

      isDrawingRef.current = true;
      const coords = getCoordinates(e);
      lastPointRef.current = coords;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, (brushSize / 2), 0, Math.PI * 2);
        ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : color;
        ctx.fill();
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !lastPointRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentPoint = getCoordinates(e);

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = brushSize;
      ctx.stroke();

      lastPointRef.current = currentPoint;
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveState();
    };

    useImperativeHandle(ref, () => ({
      getCanvasData: () => {
        const canvas = canvasRef.current;
        return canvas ? canvas.toDataURL('image/png') : '';
      },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
        saveState();
      },
      undo: () => {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.putImageData(history[newIndex], 0, 0);
          setHistoryIndex(newIndex);
        }
      },
      redo: () => {
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.putImageData(history[newIndex], 0, 0);
          setHistoryIndex(newIndex);
        }
      },
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }));

    return (
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full max-w-xl max-h-[72vh] aspect-square sm:aspect-4/3 bg-white rounded-2xl shadow-sm border border-[#EEEEEC] dark:border-[#303136] cursor-crosshair touch-none select-none"
        />
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
