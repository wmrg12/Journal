// components/optionsPage/DrawingCanvasProps.tsx

import type { Stroke } from '@/types';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { GestureResponderEvent, StyleSheet, TouchableOpacity, View } from 'react-native';

type Point = { x: number; y: number };

interface DrawingCanvasProps {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  pointsToPath: (points: Point[]) => string;
  drawMode: boolean;
  onDrawStart: (x: number, y: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;
  onDeselect: () => void;
  children?: React.ReactNode;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
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


  const { normalStrokes, eraserStrokes } = useMemo(() => {
    const normal: Stroke[] = [];
    const eraser: Stroke[] = [];

    for (const s of strokes) {
      if ((s as any)._pendingDelete) continue; 
      if (s.tool === 'eraser') eraser.push(s);
      else normal.push(s);
    }
    return { normalStrokes: normal, eraserStrokes: eraser };
  }, [strokes]);

  // Convertimos trazos normales a paths de Skia
  const normalPaths = useMemo(() => {
    return normalStrokes
      .map((stroke) => {
        const pathString = (stroke as any)._persistedPathD || pointsToPath(stroke.points as Point[]);
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) return null;
          return {
            id: stroke.id,
            path,
            color: stroke.color,
            width: stroke.width,
            opacity: stroke.opacity,
          };
        } catch {
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [normalStrokes, pointsToPath]);

  // Trazos de borrador
  const eraserPaths = useMemo(() => {
    return eraserStrokes
      .map((stroke) => {
        const pathString = pointsToPath(stroke.points as Point[]);
        try {
          const path = Skia.Path.MakeFromSVGString(pathString);
          if (!path) return null;
          return { id: stroke.id, path, width: stroke.width };
        } catch {
          return null;
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [eraserStrokes, pointsToPath]);

  // Trazo actual mientras se dibuja
  const currentPath = useMemo(() => {
    if (!currentStroke || currentStroke.points.length < 2) return null;
    try {
      const pathString = pointsToPath(currentStroke.points as Point[]);
      const path = Skia.Path.MakeFromSVGString(pathString);
      if (!path) return null;
      return {
        path,
        color: currentStroke.color,
        width: currentStroke.width,
        opacity: currentStroke.opacity,
        isEraser: currentStroke.tool === 'eraser',
      };
    } catch {
      return null;
    }
  }, [currentStroke, pointsToPath]);

  // Manejo de eventos táctiles
  const handleGrant = (e: GestureResponderEvent) => {
    if (!drawMode) return;
    const { locationX, locationY } = e.nativeEvent;
    onDrawStart(locationX, locationY);
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!drawMode) return;
    const { locationX, locationY } = e.nativeEvent;
    onDrawMove(locationX, locationY);
  };

  const handleEnd = () => {
    if (!drawMode) return;
    onDrawEnd();
  };

  return (
    <View style={StyleSheet.absoluteFill}>

      {/* Skia Canvas */}
      <Canvas style={StyleSheet.absoluteFill}>
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

          {/* Trazo actual */}
          {currentPath && (
            <Path
              path={currentPath.path}
              color={currentPath.isEraser ? '#FF6B6B' : currentPath.color}
              style="stroke"
              strokeWidth={currentPath.width}
              opacity={currentPath.isEraser ? 0.6 : currentPath.opacity}
              strokeCap="round"
              strokeJoin="round"
            />
          )}

        </Group>
      </Canvas>

      {/* Capa táctil */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => drawMode}
        onMoveShouldSetResponder={() => drawMode}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleEnd}
        onResponderTerminate={handleEnd}
      />

      {/* Capa de deselección si no estamos dibujando */}
      {!drawMode && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDeselect}
        />
      )}

      {/* Capa para botones u otros elementos */}
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={drawMode ? 'none' : 'box-none'}
      >
        {children}
      </View>
    </View>
  );
};

DrawingCanvas.displayName = 'DrawingCanvas';
export default memo(DrawingCanvas);