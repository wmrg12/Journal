// src/hooks/usePage/useSkiaDrawing.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPageDraw, deletePageDraw } from '@/src/db/dao';
import type { DrawTool, Stroke } from '@/types';

type Point = { x: number; y: number };

export const useSkiaDrawing = (currentPageId: string | null) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(20);

  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);
  const pendingSaves = useRef<Map<string, Promise<any>>>(new Map());

  // Mutable ref para el trazo en curso (evita setState en cada movimiento)
  const currentStrokeRef = useRef<Stroke | null>(null);
  // raf ref para throttling
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // limpiar RAF si queda
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // --------------------
  // util: catmull-rom -> bezier (para persistir)
  // --------------------
  const pointsToPath = useCallback((pts: Point[]) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length <= 2) {
      return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }
    const catmullRom2bezier = (p0: Point, p1: Point, p2: Point, p3: Point) => {
      const b1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const b2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      return [b1, b2, p2] as const;
    };
    const points = [{ ...pts[0] }, ...pts, { ...pts[pts.length - 1] }];
    let d = `M ${points[1].x} ${points[1].y} `;
    for (let i = 0; i < points.length - 3; i++) {
      const [b1, b2, p] = catmullRom2bezier(points[i], points[i + 1], points[i + 2], points[i + 3]);
      d += `C ${b1.x} ${b1.y} ${b2.x} ${b2.y} ${p.x} ${p.y} `;
    }
    return d.trim();
  }, []);

  // --------------------
  // distancia punto->segmento (útil en borrador robusto)
  // --------------------
  const pointToSegmentDistance = useCallback((p: Point, a: Point, b: Point) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
    const t = c1 / c2;
    const projx = a.x + t * vx;
    const projy = a.y + t * vy;
    return Math.hypot(p.x - projx, p.y - projy);
  }, []);

  // --------------------
  // split stroke por eraser (robusto)
  // --------------------
  const splitStrokeByEraser = useCallback((stroke: Stroke, eraserPoints: Point[], eraserRadius: number) => {
    const pts = stroke.points as Point[];
    if (!pts || pts.length < 2) return [];

    // Bound boxes check rápido
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));

    const eMinX = Math.min(...eraserPoints.map(p => p.x)) - eraserRadius;
    const eMaxX = Math.max(...eraserPoints.map(p => p.x)) + eraserRadius;
    const eMinY = Math.min(...eraserPoints.map(p => p.y)) - eraserRadius;
    const eMaxY = Math.max(...eraserPoints.map(p => p.y)) + eraserRadius;

    if (maxX < eMinX || minX > eMaxX || maxY < eMinY || minY > eMaxY) {
      return [{ ...stroke }];
    }

    const TOLERANCE = 6;
    const effectiveRadius = eraserRadius + TOLERANCE;
    const n = pts.length;
    const erasedSegment = new Array(Math.max(0, n - 1)).fill(false);
    const eraserSegCount = Math.max(1, eraserPoints.length - 1);

    for (let i = 0; i < n - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      let hit = false;
      for (let j = 0; j < eraserSegCount; j++) {
        const c = eraserPoints[j];
        const d = eraserPoints[Math.min(j + 1, eraserPoints.length - 1)];
        const dist = Math.min(
          pointToSegmentDistance(a, c, d),
          pointToSegmentDistance(b, c, d),
          pointToSegmentDistance(c, a, b),
          pointToSegmentDistance(d, a, b),
        );
        if (dist <= effectiveRadius) { hit = true; break; }
      }
      erasedSegment[i] = hit;
    }

    const keepPoint = new Array(n).fill(false);
    for (let i = 0; i < n - 1; i++) {
      if (!erasedSegment[i]) { keepPoint[i] = true; keepPoint[i + 1] = true; }
    }

    const segments: Point[][] = [];
    let cur: Point[] = [];
    for (let i = 0; i < n; i++) {
      if (keepPoint[i]) cur.push(pts[i]);
      else { if (cur.length > 1) segments.push(cur.slice()); cur = []; }
    }
    if (cur.length > 1) segments.push(cur.slice());

    // fallback extra si no detectó nada
    if (segments.length === 0) {
      const extraTol = effectiveRadius + 4;
      let cur2: Point[] = [];
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        let hit = false;
        for (let j = 0; j < eraserSegCount; j++) {
          const c = eraserPoints[j];
          const d = eraserPoints[Math.min(j + 1, eraserPoints.length - 1)];
          const pd = pointToSegmentDistance(p, c, d);
          if (pd <= extraTol) { hit = true; break; }
        }
        if (!hit) cur2.push(p);
        else { if (cur2.length > 1) segments.push(cur2.slice()); cur2 = []; }
      }
      if (cur2.length > 1) segments.push(cur2.slice());
    }

    return segments.map((ptsSeg, idx) => ({
      id: `${stroke.id}_seg_${idx}_${Date.now()}`,
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity,
      points: ptsSeg,
    } as Stroke));
  }, [pointToSegmentDistance]);

  // --------------------
  // processEraser (usa splitStrokeByEraser)
  // --------------------
  const processEraser = useCallback((eraserStroke: Stroke, allStrokes: Stroke[]) => {
    const eraserRadius = eraserStroke.width / 2;
    const newStrokes: Stroke[] = [];
    const toDeletePersisted: string[] = [];

    for (const stroke of allStrokes) {
      if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
        newStrokes.push(stroke);
        continue;
      }
      const segments = splitStrokeByEraser(stroke, eraserStroke.points as Point[], eraserRadius);

      if (segments.length === 0) {
        if (!stroke.id.startsWith('temp_')) toDeletePersisted.push(stroke.id);
      } else if (segments.length === 1 && segments[0].points.length === (stroke.points as Point[]).length) {
        newStrokes.push(stroke);
      } else {
        newStrokes.push(...segments);
        if (!stroke.id.startsWith('temp_')) toDeletePersisted.push(stroke.id);

        if (currentPageId) {
          segments.forEach(segment => {
            const pathD = pointsToPath(segment.points as Point[]);
            createPageDraw(currentPageId, pathD, segment.color, segment.width, segment.opacity, segment.tool as any)
              .catch(e => console.error('Error saving segment:', e));
          });
        }
      }
    }

    toDeletePersisted.forEach(id => deletePageDraw(id).catch(e => console.error('Error deleting draw:', e)));
    return newStrokes;
  }, [splitStrokeByEraser, pointsToPath, currentPageId]);

  // --------------------
  // estilo herramienta
  // --------------------
  const getToolStyle = useCallback((tool: DrawTool) => {
    const base = strokeWidth;
    switch (tool) {
      case 'pencil': return { width: base, opacity: 0.95 };
      case 'marker': return { width: base * 3, opacity: 0.5 };
      case 'pen': return { width: base * 1.5, opacity: 0.9 };
      case 'eraser': return { width: eraserWidth, opacity: 1 };
      default: return { width: base, opacity: 1 };
    }
  }, [strokeWidth, eraserWidth]);

  // --------------------
  // START: crea trazo y lo guarda en currentStrokeRef (sin setState)
  // --------------------
  const onDrawStart = useCallback((x: number, y: number) => {
    const { width, opacity } = getToolStyle(selectedTool);
    const newStroke: Stroke = {
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tool: selectedTool,
      color: selectedTool === 'eraser' ? '#FF0000' : selectedColor,
      width,
      opacity: selectedTool === 'eraser' ? 0.3 : opacity,
      points: [{ x, y }],
    };
    currentStrokeRef.current = newStroke;
    // ponemos estado una vez para que Skia muestre inicio
    setCurrentStroke(newStroke);
  }, [getToolStyle, selectedTool, selectedColor]);

  // --------------------
  // MOVE: agregamos puntos a currentStrokeRef; throttle con RAF para actualizar UI
  // --------------------
  const onDrawMove = useCallback((x: number, y: number) => {
    const cur = currentStrokeRef.current;
    if (!cur) return;

    const last = cur.points[cur.points.length - 1] as Point;
    const dx = x - last.x, dy = y - last.y;
    const dist = Math.hypot(dx, dy);

    const MIN_DIST = 1.5; // ajustar para sensibilidad
    if (dist < MIN_DIST) return;

    const STEP = 4; // interpolación: px entre puntos
    if (dist > STEP) {
      const steps = Math.floor(dist / STEP);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        cur.points.push({ x: last.x + dx * t, y: last.y + dy * t });
      }
    } else {
      cur.points.push({ x, y });
    }

    // Throttle UI update con RAF (una actualización por frame)
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        // Actualiza estado para re-render (Skia dibujará currentStroke)
        // clonar para romper referencia
        const snapshot = currentStrokeRef.current ? { ...currentStrokeRef.current, points: [...currentStrokeRef.current.points] } : null;
        setCurrentStroke(snapshot);
      });
    }
  }, []);

  // --------------------
  // END: tomar currentStrokeRef, guardarlo en strokes y persistir async
  // --------------------
  const onDrawEnd = useCallback(() => {
    const cur = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setCurrentStroke(null);

    if (!cur || (cur.points?.length ?? 0) < 2) return;

    // Eraser -> procesar borrado
    if (cur.tool === 'eraser') {
      undoStack.current.push(strokes.slice());
      redoStack.current = [];
      setStrokes(current => processEraser(cur, current));
      return;
    }

    // Normal stroke -> insertar en estado y persistir
    undoStack.current.push(strokes.slice());
    redoStack.current = [];
    setStrokes(s => [...s, cur]);

    if (currentPageId) {
      const pathD = pointsToPath(cur.points as Point[]);
      const savePromise = createPageDraw(currentPageId, pathD, cur.color, cur.width, cur.opacity, cur.tool as any)
        .then((result) => {
          setStrokes(sts => sts.map(s => s.id === cur.id ? { ...s, id: (result && (result as any).id) || cur.id, _persistedPathD: pathD } : s));
          pendingSaves.current.delete(cur.id);
        })
        .catch(e => {
          console.error('Error saving stroke:', e);
          pendingSaves.current.delete(cur.id);
        });
      pendingSaves.current.set(cur.id, savePromise);
    }
  }, [currentPageId, pointsToPath, processEraser, strokes]);

  // --------------------
  // utiles: undo/redo/clear
  // --------------------
  const undo = useCallback(() => {
    setStrokes(prev => {
      if (!prev.length) return prev;
      redoStack.current.push(prev.slice());
      const prevState = undoStack.current.pop() || [];
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setStrokes(prev => {
      if (!redoStack.current.length) return prev;
      undoStack.current.push(prev.slice());
      const next = redoStack.current.pop() || [];
      return next;
    });
  }, []);

  const clearAll = useCallback(async () => {
    const persisted = strokes.filter(s => s.id && !s.id.startsWith('temp_')).map(s => s.id);
    setStrokes([]);
    undoStack.current = [];
    redoStack.current = [];
    for (const id of persisted) {
      try { await deletePageDraw(id); } catch (e) { console.error('Error deleting stroke:', e); }
    }
  }, [strokes]);

  const stopDrawing = useCallback(() => { setDrawMode(false); currentStrokeRef.current = null; setCurrentStroke(null); }, []);
  const clearEraserStrokes = useCallback(() => setStrokes(prev => prev.filter(s => s.tool !== 'eraser')), []);
  const waitForPendingSaves = useCallback(async () => { const ps = Array.from(pendingSaves.current.values()); if (ps.length) { await Promise.allSettled(ps); pendingSaves.current.clear(); } }, []);
  const deleteStroke = useCallback(async (strokeId: string) => { setStrokes(prev => prev.filter(s => s.id !== strokeId)); if (!strokeId.startsWith('temp_')) { try { await deletePageDraw(strokeId); } catch (e) { console.error(e); } } }, []);

  return {
    strokes, setStrokes, currentStroke,
    drawMode, setDrawMode, selectedTool, selectedColor, setSelectedColor,
    strokeWidth, setStrokeWidth, eraserWidth, setEraserWidth,
    onDrawStart, onDrawMove, onDrawEnd,
    handleSelectTool: (t: DrawTool) => setSelectedTool(t),
    pointsToPath,
    clearEraserStrokes, waitForPendingSaves, deleteStroke, clearAllStrokes: clearAll,
    stopDrawing, undo, redo, clearAll
  };
};