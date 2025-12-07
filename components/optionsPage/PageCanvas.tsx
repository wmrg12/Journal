// components/SkiaCanvas.tsx
import type { Stroke } from '@/types';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SkiaCanvasProps {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  pointsToPath: (points: { x: number; y: number }[]) => string;
  drawMode: boolean;
  onDrawStart: (x: number, y: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
  onDeselect: () => void;
  children?: React.ReactNode;
}

const SkiaCanvas: React.FC<SkiaCanvasProps> = ({
  strokes,
  currentStroke,
  pointsToPath,
  drawMode,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  onDeselect,
  children,
}) => {
  // Separar trazos normales de trazos de borrador
  const { normalStrokes, eraserStrokes } = useMemo(() => {
    const normal: Stroke[] = [];
    const eraser: Stroke[] = [];

    strokes.forEach((stroke) => {
      // Ignorar trazos marcados para eliminar
      if ((stroke as any)._pendingDelete) return;
      
      // Separar por tipo de herramienta
      if (stroke.tool === 'eraser') {
        eraser.push(stroke);
      } else {
        normal.push(stroke);
      }
    });

    console.log(` Canvas: ${normal.length} trazos normales, ${eraser.length} trazos de borrador`);
    return { normalStrokes: normal, eraserStrokes: eraser };
  }, [strokes]);

  // Convertir trazos normales a Skia Paths
  const normalPaths = useMemo(() => {
    return normalStrokes
      .map((stroke) => {
        // Usar path guardado si existe, sino generarlo
        const pathString = (stroke as any)._persistedPathD || pointsToPath(stroke.points);
        
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) {
            console.warn(' Skia: MakeFromSVGString returned null for stroke', stroke.id);
            return null;
          }
          return {
            path,
            color: stroke.color,
            width: stroke.width,
            opacity: stroke.opacity,
            id: stroke.id,
          };
        } catch (e) {
          console.warn('Skia: failed to create path from SVG string for stroke', stroke.id, e);
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [normalStrokes, pointsToPath]);

  // Convertir trazos de borrador a Skia Paths (solo para visualización)
  const eraserPaths = useMemo(() => {
    return eraserStrokes
      .map((stroke) => {
        const pathString = pointsToPath(stroke.points);
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) return null;
          return { path, width: stroke.width, id: stroke.id };
        } catch (e) {
          console.warn(' Skia: failed to create eraser path', stroke.id, e);
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [eraserStrokes, pointsToPath]);

  // Path del trazo actual (en progreso)
  const currentPath = useMemo(() => {
    if (!currentStroke || currentStroke.points.length < 2) return null;
    
    try {
      const pathString = pointsToPath(currentStroke.points);
      const path = Skia.Path.MakeFromSVGString(pathString);
      if (!path) return null;
      
      return {
        path,
        color: currentStroke.color,
        width: currentStroke.width,
        opacity: currentStroke.opacity,
        isEraser: currentStroke.tool === 'eraser',
      };
    } catch (e) {
      console.warn(' Skia: failed to create current stroke path', e);
      return null;
    }
  }, [currentStroke, pointsToPath]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Canvas Skia */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group layer>
          {/* Trazos normales permanentes */}
          {normalPaths.map((item) => (
            <Path
              key={item.id}
              path={item.path}
              color={item.color}
              style="stroke"
              strokeWidth={item.width}
              opacity={item.opacity}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}

          {/* Trazo actual (si no es borrador) */}
          {currentPath && !currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={Math.max(1, currentPath.width * 1.08)}
              opacity={Math.min(1, (currentPath.opacity ?? 1) * 1.05)}
              strokeCap="round"
              strokeJoin="round"
            />
          )}

          {/* Trazos de borrador guardados (solo visual, no deberían existir) */}
          {eraserPaths.map((item) => (
            <Path
              key={item.id}
              path={item.path}
              color="#FF6B6B"
              style="stroke"
              strokeWidth={item.width}
              strokeCap="round"
              strokeJoin="round"
              opacity={0.3}
            />
          ))}

          {/* Trazo actual del borrador (preview) */}
          {currentPath && currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color="#FF6B6B"
              style="stroke"
              strokeWidth={currentPath.width}
              strokeCap="round"
              strokeJoin="round"
              opacity={0.5}
            />
          )}
        </Group>
      </Canvas>

      {/* Capa de interacción para dibujo */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => !!drawMode}
        onMoveShouldSetResponder={() => !!drawMode}
        onResponderGrant={(event) => {
          if (!drawMode) return;
          const { locationX, locationY } = event.nativeEvent;
          onDrawStart(locationX, locationY);
        }}
        onResponderMove={(event) => {
          if (!drawMode) return;
          const { locationX, locationY } = event.nativeEvent;
          onDrawMove(locationX, locationY);
        }}
        onResponderRelease={() => {
          if (!drawMode) return;
          onDrawEnd();
        }}
        onResponderTerminate={() => {
          if (!drawMode) return;
          onDrawEnd();
        }}
      />

      {/* Capa para deseleccionar (cuando no está dibujando) */}
      {!drawMode && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDeselect}
        />
      )}

      {/* Contenedor para otros elementos (stickers, textos, etc.) */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={drawMode ? 'none' : 'box-none'}
      >
        {children}
      </View>
    </View>
  );
};

SkiaCanvas.displayName = 'SkiaCanvas';

export default memo(SkiaCanvas);