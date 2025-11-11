import { useState, useCallback } from 'react';
import { createPageDraw } from '@/src/db/dao';
import { DrawTool, Stroke } from '@/types';

export const useDrawing = (currentPageId: string | null) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(3);

  const pointsToPath = useCallback((pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    const [p0, ...rest] = pts;
    return `M ${p0.x} ${p0.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  }, []);

  const getToolStyle = useCallback(
    (tool: DrawTool) => {
      const base = strokeWidth;
      switch (tool) {
        case 'pencil':
          return { width: Math.max(1, base), opacity: 0.95 };
        case 'marker':
          return { width: Math.max(6, base * 3), opacity: 0.5 };
        case 'pen':
          return { width: Math.max(2, base * 2), opacity: 0.9 };
        case 'eraser':
          return { width: Math.max(10, eraserWidth * 5), opacity: 1 };
        default:
          return { width: base, opacity: 1 };
      }
    },
    [strokeWidth, eraserWidth],
  );

  const eraseFromStrokes = useCallback(
    (x: number, y: number, radius: number, strokes: Stroke[]) => {
      const newStrokes: Stroke[] = [];

      strokes.forEach((stroke) => {
        const segments: { x: number; y: number }[][] = [];
        let currentSegment: { x: number; y: number }[] = [];

        stroke.points.forEach((point) => {
          const dx = point.x - x;
          const dy = point.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance >= radius) {
            currentSegment.push(point);
          } else {
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }
            currentSegment = [];
          }
        });

        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }

        segments.forEach((segmentPoints) => {
          if (segmentPoints.length >= 2) {
            newStrokes.push({
              ...stroke,
              id: stroke.id + '_' + Math.random().toString(36).slice(2),
              points: segmentPoints,
            });
          }
        });
      });

      return newStrokes;
    },
    [],
  );

  const onDrawStart = useCallback(
    (x: number, y: number) => {
      if (selectedTool === 'eraser') {
        const eraserRadius = getToolStyle('eraser').width / 2;
        setStrokes((prev) => eraseFromStrokes(x, y, eraserRadius, prev));
      } else {
        const { width, opacity } = getToolStyle(selectedTool);
        const s: Stroke = {
          id: String(Date.now()) + Math.random().toString(36).slice(2),
          tool: selectedTool,
          color: selectedColor,
          width,
          opacity,
          points: [{ x, y }],
        };
        setCurrentStroke(s);
      }
    },
    [getToolStyle, selectedTool, selectedColor, eraseFromStrokes],
  );

  const onDrawMove = useCallback(
    (x: number, y: number) => {
      if (selectedTool === 'eraser') {
        const eraserRadius = getToolStyle('eraser').width / 2;
        setStrokes((prev) => eraseFromStrokes(x, y, eraserRadius, prev));
      } else {
        setCurrentStroke((prev) => {
          if (!prev) return prev;
          const last = prev.points[prev.points.length - 1];
          const dx = x - last.x,
            dy = y - last.y;
          if (dx * dx + dy * dy < 1.5) return prev;
          return { ...prev, points: [...prev.points, { x, y }] };
        });
      }
    },
    [selectedTool, getToolStyle, eraseFromStrokes],
  );

  const onDrawEnd = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;
      if (prev.tool === 'eraser') return null;

      setStrokes((s) => [...s, prev]);
      try {
        if (currentPageId && typeof createPageDraw === 'function') {
          const pathD = pointsToPath(prev.points);
          createPageDraw(currentPageId, pathD, prev.color, prev.width, prev.opacity, prev.tool);
        }
      } catch (e) {
        console.error('No se pudo guardar el trazo', e);
      }
      return null;
    });
  }, [currentPageId, pointsToPath]);

  const handleSelectTool = useCallback((tool: DrawTool) => {
    setSelectedTool(tool);
  }, []);

  return {
    strokes,
    setStrokes,
    currentStroke,
    drawMode,
    setDrawMode,
    selectedTool,
    selectedColor,
    setSelectedColor,
    strokeWidth,
    setStrokeWidth,
    eraserWidth,
    setEraserWidth,
    pointsToPath,
    onDrawStart,
    onDrawMove,
    onDrawEnd,
    handleSelectTool,
  };
};