import React, { memo, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Canvas, Path, Group, Skia } from '@shopify/react-native-skia';
import type { Stroke } from '@/types';
import  S  from '@/styles/pageViewStyles';

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
  // Separar trazos normales de trazos de borrador
  const { normalStrokes, eraserStrokes } = useMemo(() => {
    const normal: Stroke[] = [];
    const eraser: Stroke[] = [];

    strokes.forEach((stroke) => {
      if (stroke.tool === 'eraser') {
        eraser.push(stroke);
      } else {
        normal.push(stroke);
      }
    });

    return { normalStrokes: normal, eraserStrokes: eraser };
  }, [strokes]);

  // Convertir trazos normales a Skia Paths
  const normalPaths = useMemo(() => {
    return normalStrokes
      .map((stroke) => {
        const pathString = stroke._persistedPathD || pointsToPath(stroke.points);
        const path = Skia.Path.MakeFromSVGString(pathString);

        if (!path) {
          console.warn('Failed to create path for stroke:', stroke.id);
          return null;
        }

        return {
          path,
          color: stroke.color,
          width: stroke.width,
          opacity: stroke.opacity,
          id: stroke.id,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [normalStrokes, pointsToPath]);

  // Convertir trazos de borrador a Skia Paths
  const eraserPaths = useMemo(() => {
    return eraserStrokes
      .map((stroke) => {
        const pathString = pointsToPath(stroke.points);
        const path = Skia.Path.MakeFromSVGString(pathString);

        if (!path) return null;

        return {
          path,
          width: stroke.width,
          id: stroke.id,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [eraserStrokes, pointsToPath]);

  // Path del trazo actual
  const currentPath = useMemo(() => {
    if (!currentStroke || currentStroke.points.length < 2) return null;

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
  }, [currentStroke, pointsToPath]);

  return (
    <View style={S.containerD}>
      {/* Canvas Skia */}
      <Canvas style={[S.canvasD, { width, height }]} pointerEvents="none">
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

          {/* Trazo actual */}
          {currentPath && !currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color={currentPath.color}
              style="stroke"
              strokeWidth={currentPath.width}
              opacity={currentPath.opacity}
              strokeCap="round"
              strokeJoin="round"
            />
          )}

          {/* Trazos de borrador */}
          {eraserPaths.map((item) => (
            <Path
              key={item.id}
              path={item.path}
              color="#000000"
              style="stroke"
              strokeWidth={item.width}
              strokeCap="round"
              strokeJoin="round"
              blendMode="clear"
            />
          ))}

          {/* Trazo actual del borrador */}
          {currentPath && currentPath.isEraser && (
            <Path
              path={currentPath.path}
              color="#000000"
              style="stroke"
              strokeWidth={currentPath.width}
              strokeCap="round"
              strokeJoin="round"
              blendMode="clear"
            />
          )}
        </Group>
      </Canvas>

      {/* Touch handling con View responders */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => drawMode}
        onMoveShouldSetResponder={() => drawMode}
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

      {/* Capa para deseleccionar */}
      {!drawMode && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDeselect}
        />
      )}

      {/* Capa de elementos interactivos */}
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