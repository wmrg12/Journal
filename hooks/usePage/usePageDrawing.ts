// src/hooks/useSkiaDrawing.ts
import { useState, useCallback, useRef } from 'react';
import { createPageDraw, deletePageDraw } from '@/src/db/dao';
import type { DrawTool, Stroke } from '@/types';

/**
 * Hook para dibujo con Skia (mejorado: suavizado Catmull-Rom -> Bézier,
 * manejo de saves pendientes, eraser splitting y stopDrawing).
 */

type Point = { x: number; y: number };

export const useSkiaDrawing = (currentPageId: string | null) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(20);

  
  // Track de operaciones pendientes a la hora de persistir trazos
  const pendingSaves = useRef<Map<string, Promise<any>>>(new Map());

  // --------------------
  // UTIL: convertir puntos a path suave (Catmull-Rom -> Bézier)
  // --------------------
  const pointsToPath = useCallback((pts: { x: number; y: number }[]) => {
    if (!pts || pts.length === 0) return '';

    // Para pocos puntos, linea simple
    if (pts.length <= 2) {
      return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    // Helper que convierte un tramo Catmull-Rom a control points Bezier
    const catmullRom2bezier = (p0: Point, p1: Point, p2: Point, p3: Point) => {
      const b1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const b2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      return [b1, b2, p2] as const;
    };    

    // Pad endpoints (replicar primer y último punto) para buenos extremos
    const points = [{ ...pts[0] }, ...pts, { ...pts[pts.length - 1] }];

    let d = `M ${points[1].x} ${points[1].y} `;

    for (let i = 0; i < points.length - 3; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const p2 = points[i + 2];
      const p3 = points[i + 3];

      const [b1, b2, p] = catmullRom2bezier(p0, p1, p2, p3);
      d += `C ${b1.x} ${b1.y} ${b2.x} ${b2.y} ${p.x} ${p.y} `;
    }

    return d.trim();
  }, []);

  // --------------------
  // UTIL: distancia al cuadrado
  // --------------------
  const isPointNearPoint = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }, radius: number) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy <= radius * radius;
  }, []);

  // --------------------
  // Split de un stroke cuando el borrador lo corta
  // --------------------
  const splitStrokeByEraser = useCallback((stroke: Stroke, eraserPoints: { x: number; y: number }[], eraserRadius: number): Stroke[] => {
    const segments: { x: number; y: number }[][] = [];
    let currentSegment: { x: number; y: number }[] = [];

    for (const point of stroke.points) {
      const isErased = eraserPoints.some(ep => isPointNearPoint(point, ep, eraserRadius));
      if (isErased) {
        if (currentSegment.length > 1) {
          segments.push([...currentSegment]);
        }
        currentSegment = [];
      } else {
        currentSegment.push(point);
      }
    }

    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }

    // map a objetos Stroke nuevos
    return segments.map((points, index) => ({
      id: `${stroke.id}_seg_${index}_${Date.now()}`,
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity,
      points,
    }));
  }, [isPointNearPoint]);

  // --------------------
  // Procesa el eraser: recorta, guarda segmentos y borra persistidos
  // --------------------
  const processEraser = useCallback((eraserStroke: Stroke, allStrokes: Stroke[]) => {
    const eraserRadius = eraserStroke.width / 2;
    const newStrokes: Stroke[] = [];
    const strokesToDelete: string[] = [];

    for (const stroke of allStrokes) {
      // Ignorar trazos temporales o borradores
      if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
        newStrokes.push(stroke);
        continue;
      }

      const hasIntersection = stroke.points.some(pt =>
        eraserStroke.points.some(ep => isPointNearPoint(pt, ep, eraserRadius))
      );

      if (hasIntersection) {
        const segments = splitStrokeByEraser(stroke, eraserStroke.points, eraserRadius);
        if (segments.length > 0) {
          newStrokes.push(...segments);
          if (!stroke.id.startsWith('temp_')) strokesToDelete.push(stroke.id);

          // Guardar segmentos nuevos (async)
          if (currentPageId) {
            segments.forEach(segment => {
              const pathD = pointsToPath(segment.points);
              createPageDraw(
                currentPageId,
                pathD,
                segment.color,
                segment.width,
                segment.opacity,
                segment.tool as 'pencil' | 'pen' | 'marker',
              ).catch(e => console.error('Error guardando segmento:', e));
            });
          }
        } else {
          // Todo borrado -> eliminar persistido
          if (!stroke.id.startsWith('temp_')) strokesToDelete.push(stroke.id);
        }
      } else {
        newStrokes.push(stroke);
      }
    }

    // borrar persistidos
    strokesToDelete.forEach(id => {
      deletePageDraw(id).catch(e => console.error('Error eliminando trazo:', e));
    });

    return newStrokes;
  }, [splitStrokeByEraser, isPointNearPoint, pointsToPath, currentPageId]);

  // --------------------
  // Estilo según herramienta
  // --------------------
  const getToolStyle = useCallback((tool: DrawTool) => {
    const base = strokeWidth;
    switch (tool) {
      case 'pencil':
        return { width: base, opacity: 0.95 };
      case 'marker':
        return { width: base * 3, opacity: 0.5 };
      case 'pen':
        return { width: base * 1.5, opacity: 0.9 };
      case 'eraser':
        return { width: eraserWidth, opacity: 1 };
      default:
        return { width: base, opacity: 1 };
    }
  }, [strokeWidth, eraserWidth]);

  // --------------------
  // Inicia trazo
  // --------------------
  const onDrawStart = useCallback((x: number, y: number) => {
    const { width, opacity } = getToolStyle(selectedTool);
    const newStroke: Stroke = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tool: selectedTool,
      color: selectedTool === 'eraser' ? '#FF0000' : selectedColor,
      width,
      opacity: selectedTool === 'eraser' ? 0.3 : opacity,
      points: [{ x, y }],
    };
    setCurrentStroke(newStroke);
  }, [getToolStyle, selectedTool, selectedColor]);

  // --------------------
  // Mover trazo (muestreo / reducción de puntos)
  // --------------------
  const onDrawMove = useCallback((x: number, y: number) => {
    setCurrentStroke(prev => {
      if (!prev) return prev;
      const last = prev.points[prev.points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      const distSq = dx * dx + dy * dy;

      // Ajusta este umbral: 16 => 4px, 36 => 6px
      const MIN_DIST_SQ = 16;
      if (distSq < MIN_DIST_SQ) return prev;

      return { ...prev, points: [...prev.points, { x, y }] };
    });
  }, []);

  // --------------------
  // Termina trazo
  // --------------------
  const onDrawEnd = useCallback(() => {
    setCurrentStroke(prev => {
      if (!prev || prev.points.length < 2) return null;
      const finalStroke = { ...prev };

      if (finalStroke.tool === 'eraser') {
        // procesar borrado contra todos los trazos
        setStrokes(current => processEraser(finalStroke, current));
        return null;
      }

      // agregar al estado
      setStrokes(s => [...s, finalStroke]);

      // persistir en DB (async) y actualizar id temp cuando la DB responda
      if (currentPageId) {
        const pathD = pointsToPath(finalStroke.points);

        const savePromise = createPageDraw(
          currentPageId,
          pathD,
          finalStroke.color,
          finalStroke.width,
          finalStroke.opacity,
          finalStroke.tool as 'pencil' | 'pen' | 'marker',
        )
          .then((result) => {
            // reemplazar id temporal por id persistido
            setStrokes(strokes => strokes.map(s =>
              s.id === finalStroke.id ? { ...s, id: result.id, _persistedPathD: pathD } : s
            ));
            pendingSaves.current.delete(finalStroke.id);
          })
          .catch(e => {
            console.error('Error guardando trazo:', e);
            pendingSaves.current.delete(finalStroke.id);
          });

        pendingSaves.current.set(finalStroke.id, savePromise);
      }

      return null;
    });
  }, [currentPageId, pointsToPath, processEraser]);

  // --------------------
  // Stop drawing explícito (desactiva modo y descarta trazo temporal)
  // --------------------
  const stopDrawing = useCallback(() => {
    setDrawMode(false);
    setCurrentStroke(null);
  }, []);

  // --------------------
  // Limpia trazos de tipo 'eraser' (cuando desmontas)
  // --------------------
  const clearEraserStrokes = useCallback(() => {
    setStrokes(prev => prev.filter(s => s.tool !== 'eraser'));
  }, []);

  // --------------------
  // Espera a que terminen saves pendientes
  // --------------------
  const waitForPendingSaves = useCallback(async () => {
    const promises = Array.from(pendingSaves.current.values());
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      pendingSaves.current.clear();
    }
  }, []);

  // --------------------
  // Eliminar trazo específico
  // --------------------
  const deleteStroke = useCallback(async (strokeId: string) => {
    setStrokes(prev => prev.filter(s => s.id !== strokeId));
    if (!strokeId.startsWith('temp_')) {
      try {
        await deletePageDraw(strokeId);
      } catch (e) {
        console.error('Error eliminando trazo:', e);
      }
    }
  }, []);

  // --------------------
  // Borrar todos los trazos (persistidos también)
  // --------------------
  const clearAllStrokes = useCallback(async () => {
    if (!currentPageId) {
      setStrokes([]);
      return;
    }

    const persistedIds = strokes.filter(s => s.id && !s.id.startsWith('temp_')).map(s => s.id);
    setStrokes([]);

    for (const id of persistedIds) {
      try {
        await deletePageDraw(id);
      } catch (e) {
        console.error('Error eliminando trazo:', e);
      }
    }
  }, [currentPageId, strokes]);

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
    onDrawStart,
    onDrawMove,
    onDrawEnd,
    handleSelectTool: (tool: DrawTool) => setSelectedTool(tool),
    pointsToPath,
    clearEraserStrokes,
    waitForPendingSaves,
    deleteStroke,
    clearAllStrokes,
    stopDrawing,
  };
};
