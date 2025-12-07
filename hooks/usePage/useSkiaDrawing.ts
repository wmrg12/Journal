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

  // stacks undo/redo
  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);
  const pendingSaves = useRef<Map<string, Promise<any>>>(new Map());
  const processedSegments = useRef<Set<string>>(new Set()); // Para evitar duplicados

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

  const pointToSegmentDistanceSq = useCallback((p: Point, a: Point, b: Point) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const vLenSq = vx * vx + vy * vy;
    if (vLenSq === 0) {
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

  // Estilo según herramienta
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

  // Inicia trazo
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

  // Mueve trazo (muestreo)
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

  // Split stroke por borrador usando distancia punto
  const splitStrokeByEraser = useCallback((stroke: Stroke, eraserPoints: Point[], eraserRadius: number): Stroke[] => {
    const segs: Point[][] = [];
    let currentSeg: Point[] = [];
    const pts = stroke.points as Point[];
    if (!pts || pts.length < 2) return [];

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const erased = eraserPoints.some(ep => pointToSegmentDistanceSq(ep, a, b) <= eraserRadius * eraserRadius);
      if (!erased) {
        if (currentSeg.length === 0) currentSeg.push(a);
        currentSeg.push(b);
      } else {
        if (currentSeg.length > 1) {
          segs.push([...currentSeg]);
        }
        currentSeg = [];
      }
    }
    if (currentSeg.length > 1) segs.push(currentSeg);

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

  // Procesa eraser - VERSIÓN OPTIMIZADA
  const processEraser = useCallback((eraserStroke: Stroke, allStrokes: Stroke[]) => {
    const eraserRadius = eraserStroke.width / 2;
    const eraserRadiusSq = eraserRadius * eraserRadius; // Pre-calcular
    const newStrokes: Stroke[] = [];
    const toDelete: string[] = [];
    const eraserPoints = eraserStroke.points as Point[];

    // Limpiar segmentos procesados viejos (más de 5 segundos)
    const now = Date.now();
    const oldSegments = Array.from(processedSegments.current).filter(key => {
      const timestamp = parseInt(key.split('_').pop() || '0');
      return now - timestamp > 5000;
    });
    oldSegments.forEach(key => processedSegments.current.delete(key));

    for (const stroke of allStrokes) {
      // Ignorar trazos temporales y de borrador
      if (stroke.id.startsWith('temp_') || stroke.tool === 'eraser') {
        continue; // NO agregamos estos a newStrokes
      }

      // Verificar intersección con optimización
      const strokePoints = stroke.points as Point[];
      let hasIntersection = false;

      // Optimización: muestrear puntos del borrador cada 3 puntos
      const sampledEraserPoints = eraserPoints.filter((_, i) => i % 3 === 0);
      
      for (let i = 0; i < strokePoints.length && !hasIntersection; i++) {
        const strokePoint = strokePoints[i];
        
        for (let j = 0; j < sampledEraserPoints.length; j++) {
          const eraserPoint = sampledEraserPoints[j];
          const dx = strokePoint.x - eraserPoint.x;
          const dy = strokePoint.y - eraserPoint.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq <= eraserRadiusSq) {
            hasIntersection = true;
            break;
          }
        }
      }

      if (hasIntersection) {
        console.log('🔴 Intersección detectada con stroke:', stroke.id);
        
        // Dividir el trazo
        const segments = splitStrokeByEraser(stroke, eraserPoints, eraserRadius);
        
        console.log(`📝 Segmentos generados: ${segments.length}`);
        
        if (segments.length > 0) {
          // Agregar los nuevos segmentos
          newStrokes.push(...segments);
          
          // Marcar el trazo original para eliminar
          if (!stroke.id.startsWith('temp_')) {
            toDelete.push(stroke.id);
          }

          // Persistir segmentos en la DB de forma asíncrona
          if (currentPageId) {
            segments.forEach(segment => {
              // Evitar duplicados usando solo el ID base sin timestamp
              const segmentBaseId = segment.id.split('_').slice(0, -1).join('_');
              
              if (processedSegments.current.has(segmentBaseId)) {
                console.log('⚠️ Segmento ya procesado, saltando');
                return;
              }
              processedSegments.current.add(segmentBaseId);

              try {
                const pathD = pointsToPath(segment.points as Point[]);
                console.log('💾 Guardando segmento:', segment.id);
                
                createPageDraw(
                  currentPageId, 
                  pathD, 
                  segment.color, 
                  segment.width, 
                  segment.opacity, 
                  segment.tool as any
                ).then(result => {
                  console.log('✅ Segmento guardado');
                  // Actualizar el ID real del segmento
                  if (result && (result as any).id) {
                    setStrokes(prev => prev.map(s => 
                      s.id === segment.id 
                        ? { ...s, id: (result as any).id } 
                        : s
                    ));
                  }
                }).catch(e => {
                  console.error('❌ Error saving segment:', e);
                  processedSegments.current.delete(segmentBaseId);
                });
              } catch (e) {
                console.error('❌ Error generating path for segment:', e);
                processedSegments.current.delete(segmentBaseId);
              }
            });
          }
        } else {
          // Si no hay segmentos, solo eliminar
          console.log('🗑️ No hay segmentos, solo eliminando:', stroke.id);
          if (!stroke.id.startsWith('temp_')) {
            toDelete.push(stroke.id);
          }
        }
      } else {
        // Sin intersección, mantener el trazo
        newStrokes.push(stroke);
      }
    }

    console.log(`🔄 Resultado: ${newStrokes.length} trazos, ${toDelete.length} para eliminar`);

    // Eliminar trazos de la BD de forma más eficiente
    if (toDelete.length > 0) {
      // Batch delete con Promise.allSettled
      const deletePromises = toDelete.map(id => {
        console.log('🗑️ Eliminando trazo de BD:', id);
        
        const pending = pendingSaves.current.get(id);
        if (pending) {
          // Esperar a que se complete el guardado antes de eliminar
          return pending.finally(() => {
            pendingSaves.current.delete(id);
            return deletePageDraw(id);
          });
        } else {
          // Eliminar inmediatamente
          return deletePageDraw(id);
        }
      });

      // Ejecutar todos los deletes en paralelo
      Promise.allSettled(deletePromises).catch(e => 
        console.error('❌ Error en batch delete:', e)
      );
    }

    return newStrokes;
  }, [splitStrokeByEraser, pointsToPath, currentPageId]);

  // Finalizar trazo
  const onDrawEnd = useCallback(() => {
    setCurrentStroke(prev => {
      if (!prev || prev.points.length < 2) return null;
      const finalStroke = { ...prev };

      if (finalStroke.tool === 'eraser') {
        console.log('🔴 Procesando borrador con', finalStroke.points.length, 'puntos');
        
        // Guardar estado para undo
        undoStack.current.push(strokes.slice());
        redoStack.current = [];
        
        // Procesar el borrador
        setStrokes(cur => {
          const result = processEraser(finalStroke, cur);
          console.log('📊 Strokes después del borrado:', result.length);
          return result;
        });
        
        return null;
      }

      // Trazo normal (no borrador)
      undoStack.current.push(strokes.slice());
      redoStack.current = [];

      setStrokes(s => [...s, finalStroke]);

      if (currentPageId) {
        try {
          const pathD = pointsToPath(finalStroke.points as Point[]);
          const promise = createPageDraw(
            currentPageId, 
            pathD, 
            finalStroke.color, 
            finalStroke.width, 
            finalStroke.opacity, 
            finalStroke.tool as any
          )
            .then((result) => {
              setStrokes(sts => sts.map(s => 
                s.id === finalStroke.id 
                  ? { ...s, id: (result && (result as any).id) || finalStroke.id, _persistedPathD: pathD } 
                  : s
              ));
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
    processedSegments.current.clear();
    pendingSaves.current.clear(); // Limpiar también los pending saves
    
    for (const id of persisted) {
      try { 
        await deletePageDraw(id); 
      } catch (e) { 
        console.error('Error deleting stroke:', e); 
      }
    }
  }, [strokes]);

  const stopDrawing = useCallback(() => { 
    setDrawMode(false); 
    setCurrentStroke(null); 
  }, []);

  const clearEraserStrokes = useCallback(() => {
    setStrokes(prev => prev.filter(s => s.tool !== 'eraser'));
  }, []);

  const waitForPendingSaves = useCallback(async () => { 
    const ps = Array.from(pendingSaves.current.values()); 
    if (ps.length) { 
      await Promise.allSettled(ps); 
      pendingSaves.current.clear(); 
    } 
  }, []);

  const deleteStroke = useCallback(async (strokeId: string) => { 
    setStrokes(prev => prev.filter(s => s.id !== strokeId)); 
    if (!strokeId.startsWith('temp_')) { 
      try { 
        await deletePageDraw(strokeId); 
      } catch (e) { 
        console.error(e); 
      } 
    } 
  }, []);

  // Limpieza periódica de referencias
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Limpiar pending saves completados
      const pendingKeys = Array.from(pendingSaves.current.keys());
      console.log(`🧹 Limpieza periódica: ${pendingKeys.length} pending saves`);
      
      // Limpiar segmentos procesados viejos (más de 30 segundos)
      const now = Date.now();
      let cleaned = 0;
      processedSegments.current.forEach(key => {
        const parts = key.split('_');
        const timestamp = parseInt(parts[parts.length - 1]);
        if (!isNaN(timestamp) && now - timestamp > 30000) {
          processedSegments.current.delete(key);
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        console.log(`🧹 Limpiados ${cleaned} segmentos viejos`);
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(cleanupInterval);
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
    onDrawStart, 
    onDrawMove, 
    onDrawEnd,
    handleSelectTool: (t: DrawTool) => setSelectedTool(t),
    pointsToPath,
    clearEraserStrokes, 
    waitForPendingSaves, 
    deleteStroke, 
    clearAllStrokes: clearAll,
    stopDrawing, 
    undo, 
    redo, 
    clearAll
  };
};