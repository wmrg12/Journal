// src/hooks/usePage/useSkiaDrawing.ts
import { useState, useCallback, useRef } from 'react';
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

  // stacks undo/redo
  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);
  const pendingSaves = useRef<Map<string, Promise<any>>>(new Map());

  // --- Helpers: Catmull-Rom -> Bezier (para persistir pathD)
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

  // --- Distancia punto -> segmento (devuelve distancia al cuadrado)
  const pointToSegmentDistanceSq = useCallback((p: Point, a: Point, b: Point) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const vLenSq = vx * vx + vy * vy;
    if (vLenSq === 0) {
      // a === b
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      return dx * dx + dy * dy;
    }
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / vLenSq));
    const projX = a.x + t * vx;
    const projY = a.y + t * vy;
    const dx = p.x - projX;
    const dy = p.y - projY;
    return dx * dx + dy * dy;
  }, []);

  // --- Estilo según herramienta
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

  // --- Inicia trazo
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
    setCurrentStroke(newStroke);
  }, [getToolStyle, selectedTool, selectedColor]);

  // --- Muve trazo (muestreo)
  const onDrawMove = useCallback((x: number, y: number) => {
    setCurrentStroke(prev => {
      if (!prev) return prev;
      const last = prev.points[prev.points.length - 1] as Point;
      const dx = x - last.x;
      const dy = y - last.y;
      const distSq = dx * dx + dy * dy;
      const MIN_DIST_SQ = 16;
      if (distSq < MIN_DIST_SQ) return prev;
      return { ...prev, points: [...prev.points, { x, y }] };
    });
  }, []);

  // --- Split stroke por borrador usando distancia punto->segmento (más robusto)
  const splitStrokeByEraser = useCallback((stroke: Stroke, eraserPoints: Point[], eraserRadius: number): Stroke[] => {
    const segs: Point[][] = [];
    let currentSeg: Point[] = [];
    const pts = stroke.points as Point[];
    if (!pts || pts.length < 2) return [];

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      // chequea si AL MENOS UN punto del borrador está cerca del segmento AB
      const erased = eraserPoints.some(ep => pointToSegmentDistanceSq(ep, a, b) <= eraserRadius * eraserRadius);
      if (!erased) {
        // añadimos el punto a la seg actual; para no duplicar, añadimos 'a' (el inicio)
        if (currentSeg.length === 0) currentSeg.push(a);
        currentSeg.push(b);
      } else {
        // si el segmento se borra, cerramos la segment actual (si existe)
        if (currentSeg.length > 1) {
          segs.push([...currentSeg]);
        }
        currentSeg = [];
      }
    }
    if (currentSeg.length > 1) segs.push(currentSeg);

    // map a Stroke (filtrando segmentos demasiado cortos)
    return segs
      .filter(s => s.length > 1)
      .map((points, index) => ({
        id: `${stroke.id}_seg_${index}_${Date.now()}`,
        tool: stroke.tool,
        color: stroke.color,
        width: stroke.width,
        opacity: stroke.opacity,
        points,
      }));
  }, [pointToSegmentDistanceSq]);

  // --- Procesa eraser: recorta strokes, guarda segmentos nuevos y borra persistidos de forma segura
  const processEraser = useCallback((eraserStroke: Stroke, allStrokes: Stroke[]) => {
    const eraserRadius = eraserStroke.width / 2;
    const newStrokes: Stroke[] = [];
    const toDelete: string[] = [];

    for (const stroke of allStrokes) {
      if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
        // dejamos tal cual
        newStrokes.push(stroke);
        continue;
      }

      // si hay intersección segment-wise
      const hasIntersection = (stroke.points as Point[]).some((pt, idx) => {
        // comprobación rápida: distancia a cada punto (primera pasada) para performance
        // Si quieres optimizar: usar bounding boxes
        return eraserStroke.points.some(ep => {
          // usar punto->segment distancia para más robustez:
          // consideramos segmento [pt_i, pt_{i+1}] en la función split (más adelante),
          // aquí una verif rápida con punto -> punto para saltos tempranos
          const dx = (pt as Point).x - ep.x;
          const dy = (pt as Point).y - ep.y;
          return dx * dx + dy * dy <= eraserRadius * eraserRadius;
        });
      });

      if (hasIntersection) {
        const segments = splitStrokeByEraser(stroke, eraserStroke.points as Point[], eraserRadius);
        if (segments.length > 0) {
          newStrokes.push(...segments);
          if (!stroke.id.startsWith('temp_')) toDelete.push(stroke.id);

          // persistir segmentos (async)
          if (currentPageId) {
            segments.forEach(segment => {
              try {
                const pathD = pointsToPath(segment.points as Point[]);
                createPageDraw(currentPageId, pathD, segment.color, segment.width, segment.opacity, segment.tool as any)
                  .catch(e => console.error('Error saving segment:', e));
              } catch (e) {
                console.error('Error generating path for segment:', e);
              }
            });
          }
        } else {
          // todo borrado -> borrar persistido
          if (!stroke.id.startsWith('temp_')) toDelete.push(stroke.id);
        }
      } else {
        newStrokes.push(stroke);
      }
    }

    // BORRADO SEGURO: si hay pending save para el id, esperar a que termine antes de borrar
    toDelete.forEach(id => {
      const pending = pendingSaves.current.get(id);
      if (pending) {
        // esperar terminación y luego borrar
        pending
          .finally(() => {
            pendingSaves.current.delete(id);
            deletePageDraw(id).catch(e => console.error('Error deleting draw after pending save:', e));
          })
          .catch(() => {
            // ya reportado por el pending
            deletePageDraw(id).catch(e => console.error('Error deleting draw after pending save (catch):', e));
          });
      } else {
        deletePageDraw(id).catch(e => console.error('Error deleting draw:', e));
      }
    });

    return newStrokes;
  }, [splitStrokeByEraser, pointsToPath, currentPageId]);

  // --- Finalizar trazo
  const onDrawEnd = useCallback(() => {
    setCurrentStroke(prev => {
      if (!prev || prev.points.length < 2) return null;
      const finalStroke = { ...prev };

      // si es borrador -> procesar
      if (finalStroke.tool === 'eraser') {
        undoStack.current.push(strokes.slice());
        redoStack.current = [];
        setStrokes(cur => processEraser(finalStroke, cur));
        return null;
      }

      // guardamos undo
      undoStack.current.push(strokes.slice());
      redoStack.current = [];

      // agregamos al estado local
      setStrokes(s => [...s, finalStroke]);

      // persistir si hay page
      if (currentPageId) {
        try {
          const pathD = pointsToPath(finalStroke.points as Point[]);
          const promise = createPageDraw(currentPageId, pathD, finalStroke.color, finalStroke.width, finalStroke.opacity, finalStroke.tool as any)
            .then((result) => {
              // reemplazar id temporal por id persistido
              setStrokes(sts => sts.map(s => s.id === finalStroke.id ? { ...s, id: (result && (result as any).id) || finalStroke.id, _persistedPathD: pathD } : s));
              pendingSaves.current.delete(finalStroke.id);
            })
            .catch(e => {
              console.error('Error saving stroke:', e);
              pendingSaves.current.delete(finalStroke.id);
            });

          pendingSaves.current.set(finalStroke.id, promise);
        } catch (e) {
          console.error('Error building pathD:', e);
        }
      }

      return null;
    });
  }, [currentPageId, pointsToPath, processEraser, strokes]);

  // --- undo/redo/clear
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

  const stopDrawing = useCallback(() => { setDrawMode(false); setCurrentStroke(null); }, []);

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
