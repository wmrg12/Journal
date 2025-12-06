// components/SkiaCanvas.tsx
import S from '@/styles/pageViewStyles';
import type { Stroke } from '@/types';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface SkiaCanvasProps {
  width: number;
  height: number;
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
  width,
  height,
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
  // Separar trazos normales de trazos de borrador, filtrar _pendingDelete
  const { normalStrokes, eraserStrokes } = useMemo(() => {
    const normal: Stroke[] = [];
    const eraser: Stroke[] = [];

    strokes.forEach((stroke) => {
      if ((stroke as any)._pendingDelete) return; // Filtrar pendientes de borrado
      if (stroke.tool === 'eraser') eraser.push(stroke);
      else normal.push(stroke);
    });

    return { normalStrokes: normal, eraserStrokes: eraser };
  }, [strokes]);

  // Convertir trazos normales a Skia Paths (persistidos o generados)
  const normalPaths = useMemo(() => {
    return normalStrokes
      .map((stroke) => {
        const pathString = (stroke as any)._persistedPathD || pointsToPath(stroke.points);
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) {
            console.warn('Skia: MakeFromSVGString returned null for stroke', stroke.id);
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

  // Convertir trazos de borrador a Skia Paths
  const eraserPaths = useMemo(() => {
    return eraserStrokes
      .map((stroke) => {
        const pathString = pointsToPath(stroke.points);
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) return null;
          return { path, width: stroke.width, id: stroke.id };
        } catch (e) {
          console.warn('Skia: failed to create eraser path', stroke.id, e);
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [eraserStrokes, pointsToPath]);

  // Path del trazo actual (suavizado ya aplicado por pointsToPath)
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
      console.warn('Skia: failed to create current stroke path', e);
      return null;
    }
  }, [currentStroke, pointsToPath]);

  return (
    <View style={[S.containerD, { width, height }]}>
      {/* Canvas Skia */}
      <Canvas style={[S.canvasD, { width, height }]}>
        <Group layer>
          {/* Trazos normales */}
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

          {/* Trazo actual (visual más sólido mientras dibujas) */}
          {currentPath && !currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={Math.max(1, currentPath.width * 1.08)} // pequeño boost visual
              opacity={Math.min(1, (currentPath.opacity ?? 1) * 1.05)}
              strokeCap="round"
              strokeJoin="round"
            />
          )}

          {/* Trazos de borrador guardados - mostrar como líneas rojas */}
          {eraserPaths.map((item) => (
            <Path
              key={item.id}
              path={item.path}
              color="#FF6B6B"
              style="stroke"
              strokeWidth={item.width}
              strokeCap="round"
              strokeJoin="round"
              opacity={0.4}
            />
          ))}

          {/* Trazo actual del borrador - línea roja mientras dibujas */}
          {currentPath && currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color="#FF6B6B"
              style="stroke"
              strokeWidth={currentPath.width}
              strokeCap="round"
              strokeJoin="round"
              opacity={0.6}
            />
          )}
        </Group>
      </Canvas>

      {/* Touch overlay: capturamos eventos de touch y mapeamos a callbacks */}
      <View
        style={StyleSheet.absoluteFill}
        // solo responder cuando estamos en modo dibujo
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

      {/* Capa para deseleccionar (solo activa cuando NO estamos en drawMode) */}
      {!drawMode && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDeselect}
        />
      )}

      {/* Contenedor de children (elementos interactivos sobre el canvas).
          Cuando drawMode=true, los children no reciben eventos. */}
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
