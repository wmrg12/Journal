import { useState, useCallback, useRef } from 'react';
import { createPageDraw, deletePageDraw } from '@/src/db/dao';
import type { DrawTool, Stroke } from '@/types';

export const useSkiaDrawing = (currentPageId: string | null) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(20);

  // Track de operaciones pendientes
  const pendingSaves = useRef<Map<string, Promise<any>>>(new Map());

  // Convierte en puntos
  const pointsToPath = useCallback((pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    const [p0, ...rest] = pts;
    return `M ${p0.x} ${p0.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  }, []);

  const isPointNearPoint = useCallback(
    (p1: { x: number; y: number }, p2: { x: number; y: number }, radius: number): boolean => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return dx * dx + dy * dy <= radius * radius;
    },
    [],
  );

  // Divide el trazo en segmentos 
  const splitStrokeByEraser = useCallback(
    (stroke: Stroke, eraserPoints: { x: number; y: number }[], eraserRadius: number): Stroke[] => {
      const segments: { x: number; y: number }[][] = [];
      let currentSegment: { x: number; y: number }[] = [];

      for (const point of stroke.points) {
        const isErased = eraserPoints.some((eraserPoint) =>
          isPointNearPoint(point, eraserPoint, eraserRadius),
        );

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

      // Crear nuevos trazos para cada segmento
      return segments.map((points, index) => ({
        id: `${stroke.id}_seg_${index}_${Date.now()}`,
        tool: stroke.tool,
        color: stroke.color,
        width: stroke.width,
        opacity: stroke.opacity,
        points,
      }));
    },
    [isPointNearPoint],
  );

  const processEraser = useCallback(
    (eraserStroke: Stroke, allStrokes: Stroke[]): Stroke[] => {
      const eraserRadius = eraserStroke.width / 2;
      const newStrokes: Stroke[] = [];
      const strokesToDelete: string[] = [];

      for (const stroke of allStrokes) {
        if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
          newStrokes.push(stroke);
          continue;
        }
        const hasIntersection = stroke.points.some((point) =>
          eraserStroke.points.some((eraserPoint) =>
            isPointNearPoint(point, eraserPoint, eraserRadius),
          ),
        );

        if (hasIntersection) {
          const segments = splitStrokeByEraser(stroke, eraserStroke.points, eraserRadius);
          if (segments.length > 0) {
            newStrokes.push(...segments);
            if (!stroke.id.startsWith('temp_')) {
              strokesToDelete.push(stroke.id);
            }

            // Guardar los nuevos segmentos en BD
            if (currentPageId) {
              segments.forEach((segment) => {
                const pathD = pointsToPath(segment.points);
                createPageDraw(
                  currentPageId,
                  pathD,
                  segment.color,
                  segment.width,
                  segment.opacity,
                  segment.tool as 'pencil' | 'pen' | 'marker',
                ).catch((e) => console.error('Error guardando segmento:', e));
              });
            }
          } else {
            if (!stroke.id.startsWith('temp_')) {
              strokesToDelete.push(stroke.id);
            }
          }
        } else {
          newStrokes.push(stroke);
        }
      }

      strokesToDelete.forEach((strokeId) => {
        deletePageDraw(strokeId).catch((e) => {
          console.error('Error eliminando trazo:', e);
        });
      });

      return newStrokes;
    },
    [splitStrokeByEraser, isPointNearPoint, pointsToPath, currentPageId],
  );

  const getToolStyle = useCallback(
    (tool: DrawTool) => {
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
    },
    [strokeWidth, eraserWidth],
  );

  // Inicia un nuevo trazo
  const onDrawStart = useCallback(
    (x: number, y: number) => {
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
    },
    [getToolStyle, selectedTool, selectedColor],
  );

  // Agrega puntos al trazo actual
  const onDrawMove = useCallback((x: number, y: number) => {
    setCurrentStroke((prev) => {
      if (!prev) return prev;
      
      const last = prev.points[prev.points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < 4) return prev;
      
      return {
        ...prev,
        points: [...prev.points, { x, y }],
      };
    });
  }, []);

  // Finaliza trazo actual
  const onDrawEnd = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;

      const finalStroke = { ...prev };

      if (finalStroke.tool === 'eraser') {
        setStrokes((currentStrokes) => {
          return processEraser(finalStroke, currentStrokes);
        });

        return null;
      }

      setStrokes((s) => [...s, finalStroke]);

      // Guardar en BD de forma asíncrona
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
            setStrokes((strokes) =>
              strokes.map((s) =>
                s.id === finalStroke.id
                  ? { ...s, id: result.id, _persistedPathD: pathD }
                  : s
              )
            );
            pendingSaves.current.delete(finalStroke.id);
          })
          .catch((e) => {
            console.error('Error guardando trazo:', e);
            pendingSaves.current.delete(finalStroke.id);
          });

        pendingSaves.current.set(finalStroke.id, savePromise);
      }

      return null;
    });
  }, [currentPageId, pointsToPath, processEraser]);
  
  // Cambio de herramientas
  const handleSelectTool = useCallback((tool: DrawTool) => {
    setSelectedTool(tool);
  }, []);

  // Limpia los trazos borrados del estado
  const clearEraserStrokes = useCallback(() => {
    setStrokes((prev) => prev.filter((s) => s.tool !== 'eraser'));
  }, []);

  const waitForPendingSaves = useCallback(async () => {
    const promises = Array.from(pendingSaves.current.values());
    if (promises.length > 0) {
      await Promise.allSettled(promises);
      pendingSaves.current.clear();
    }
  }, []);

  // Elimina trazo especifico
  const deleteStroke = useCallback(
    async (strokeId: string) => {
      setStrokes((prev) => prev.filter((s) => s.id !== strokeId));

      if (!strokeId.startsWith('temp_')) {
        try {
          await deletePageDraw(strokeId);
        } catch (e) {
          console.error('Error eliminando trazo:', e);
        }
      }
    },
    [],
  );

  // Limpia todos los trazos
  const clearAllStrokes = useCallback(async () => {
    if (!currentPageId) return;

    const persistedIds = strokes
      .filter((s) => s.id && !s.id.startsWith('temp_'))
      .map((s) => s.id);

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
    handleSelectTool,
    pointsToPath,
    clearEraserStrokes,
    waitForPendingSaves,
    deleteStroke,
    clearAllStrokes,
  };
};