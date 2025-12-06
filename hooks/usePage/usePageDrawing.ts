// src/hooks/useSkiaDrawing.ts
import { createPageDraw, deletePageDraw } from '@/src/db/dao';
import type { DrawTool, Stroke } from '@/types';
import { useCallback, useRef, useState } from 'react';

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
  const [eraserWidth, setEraserWidth] = useState(45); // Aumentado de 20 a 45 para mejor cobertura

  
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
    // Densificar puntos del stroke AGRESIVAMENTE para mejor detección
    const densifyPoints = (pts: { x: number; y: number }[], maxSeg: number) => {
      if (!pts || pts.length <= 1) return pts.slice();
      const out: { x: number; y: number }[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        out.push(p1);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        // Generar más puntos intermedios (división más pequeña)
        const steps = Math.max(2, Math.ceil(dist / maxSeg));
        for (let s = 1; s <= steps; s++) {
          const t = s / (steps + 1);
          out.push({ x: p1.x + dx * t, y: p1.y + dy * t });
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    };

    // Crear un área de búsqueda expandida alrededor del eraser para mejor detección
    const createEraserBounds = (pts: { x: number; y: number }[]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { minX: minX - eraserRadius, minY: minY - eraserRadius, maxX: maxX + eraserRadius, maxY: maxY + eraserRadius };
    };

    const eraserBounds = createEraserBounds(eraserPoints);

    // Densificar más agresivamente (cada 2-3 píxeles)
    const maxSeg = Math.max(2, Math.round(eraserRadius * 0.5));
    const dense = densifyPoints(stroke.points, maxSeg);

    // Función mejorada: detectar si un punto está dentro del radio (expandido)
    const isPointErasedByEraser = (point: { x: number; y: number }) => {
      // Primero revisar bounds para optimizar
      if (point.x < eraserBounds.minX || point.x > eraserBounds.maxX ||
          point.y < eraserBounds.minY || point.y > eraserBounds.maxY) {
        return false;
      }

      // Revisar distancia a todos los puntos del eraser
      return eraserPoints.some(ep => isPointNearPoint(point, ep, eraserRadius * 1.2)); // Expandir radio 20%
    };

    const segments: { x: number; y: number }[][] = [];
    let currentSegment: { x: number; y: number }[] = [];

    for (const point of dense) {
      const isErased = isPointErasedByEraser(point);
      if (isErased) {
        if (currentSegment.length > 0) {
          segments.push([...currentSegment]);
        }
        currentSegment = [];
      } else {
        currentSegment.push(point);
      }
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    // Filtrar segmentos muy pequeños (menos de 2 puntos no tienen sentido)
    const validSegments = segments.filter(seg => seg.length >= 2);

    // Mapear a objetos Stroke nuevos
    return validSegments.map((points, index) => ({
      id: `${stroke.id}_seg_${index}_${Date.now()}`,
      tool: stroke.tool,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity,
      points,
    }));
  }, [isPointNearPoint]);

  // --------------------
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
      opacity: selectedTool === 'eraser' ? 0.5 : opacity,
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

      // Ajusta este umbral: para eraser ser más denso (muestreo cada ~3px)
      // Para otros herramientas: ~4px (16)
      const MIN_DIST_SQ = prev.tool === 'eraser' ? 9 : 16;
      if (distSq < MIN_DIST_SQ) return prev;

      return { ...prev, points: [...prev.points, { x, y }] };
    });
  }, []);

  // Track si el eraser está procesando
  const eraserProcessingRef = useRef(false);

  // --------------------
  // Termina trazo
  // --------------------
  const onDrawEnd = useCallback(() => {
    setCurrentStroke(prev => {
      if (!prev || prev.points.length < 2) return null;
      const finalStroke = { ...prev };

      if (finalStroke.tool === 'eraser') {
        eraserProcessingRef.current = true;

        try {
          const eraserRadius = finalStroke.width / 2;
          const currentStrokes = strokes;
          const newStrokes: Stroke[] = [];
          const strokesToDelete: { id: string; tool: DrawTool }[] = [];
          const segmentsToCreate: { segment: Stroke; pathD?: string }[] = [];

          for (const stroke of currentStrokes) {
            if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
              newStrokes.push(stroke);
              continue;
            }

            const hasIntersection = stroke.points.some(pt =>
              finalStroke.points.some(ep => isPointNearPoint(pt, ep, eraserRadius))
            );

            if (hasIntersection) {
              const segments = splitStrokeByEraser(stroke, finalStroke.points, eraserRadius);
              if (segments.length > 0) {
                newStrokes.push(...segments);
                if (!stroke.id.startsWith('temp_')) {
                  strokesToDelete.push({ id: stroke.id, tool: stroke.tool });
                }

                if (currentPageId) {
                  for (const segment of segments) {
                    segmentsToCreate.push({ segment });
                  }
                }
              } else {
                if (!stroke.id.startsWith('temp_')) {
                  strokesToDelete.push({ id: stroke.id, tool: stroke.tool });
                }
              }
            } else {
              newStrokes.push(stroke);
            }
          }

          setStrokes(newStrokes);

          (async () => {
            try {
              if (strokesToDelete.length > 0) {
                const deletePromises = strokesToDelete.map(item =>
                  deletePageDraw(item.id).catch(e => console.error('Error eliminando trazo:', e))
                );
                await Promise.allSettled(deletePromises);
              }

              if (segmentsToCreate.length > 0 && currentPageId) {
                const createPromises: Promise<any>[] = [];
                for (const entry of segmentsToCreate) {
                  try {
                    const pathD = pointsToPath(entry.segment.points);
                    if (typeof pathD === 'string' && pathD.length > 200000) {
                      console.warn('Omitiendo guardado de segmento: pathD demasiado grande', pathD.length);
                      continue;
                    }
                    createPromises.push(
                      createPageDraw(
                        currentPageId,
                        pathD,
                        entry.segment.color,
                        entry.segment.width,
                        entry.segment.opacity,
                        entry.segment.tool as 'pencil' | 'pen' | 'marker',
                      ).catch(e => console.error('Error guardando segmento:', e))
                    );
                  } catch (e) {
                    console.error('Error generando pathD para segmento:', e);
                  }
                }
                if (createPromises.length > 0) await Promise.allSettled(createPromises);
              }
            } finally {
              eraserProcessingRef.current = false;
            }
          })();

        } catch (e) {
          console.error('Error procesando eraser (síncrono):', e);
          eraserProcessingRef.current = false;
        }

        setCurrentStroke(null);
        return null;
      }

      // Para otros herramientas: agregar trazo al estado
      setStrokes(s => [...s, finalStroke]);

      // Persistir en DB (async)
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
            setStrokes(allStrokes => allStrokes.map(s =>
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
  }, [currentPageId, pointsToPath, splitStrokeByEraser, isPointNearPoint, strokes]);

  // Stop drawing explícito (desactiva modo y descarta trazo temporal)
  const stopDrawing = useCallback(() => {
    setDrawMode(false);
    setCurrentStroke(null);
  }, []);

  // Limpia trazos de tipo 'eraser' (cuando desmontas)
  const clearEraserStrokes = useCallback(() => {
    setStrokes(prev => prev.filter(s => s.tool !== 'eraser'));
  }, []);

  // Espera a que terminen saves pendientes
  const waitForPendingSaves = useCallback(async () => {
    const promises = Array.from(pendingSaves.current.values());
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      pendingSaves.current.clear();
    }
  }, []);

  // Eliminar trazo específico
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

  // Borrar todos los trazos 
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
