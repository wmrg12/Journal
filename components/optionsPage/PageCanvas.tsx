// page/pageCanvas.tsx
import S from '@/styles/pageViewStyles';
import type { Stroke } from '@/types';
import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type PageCanvasProps = {
  drawMode: boolean;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  pointsToPath: (points: { x: number; y: number }[]) => string;
  onDrawStart: (x: number, y: number) => void;
  onDrawMove: (x: number, y: number) => void;
  onDrawEnd: () => void;

  onDeselectText: () => void;

  children: React.ReactNode;
};

const PageCanvas = memo(
  ({
    drawMode,
    strokes,
    currentStroke,
    pointsToPath,
    onDrawStart,
    onDrawMove,
    onDrawEnd,
    onDeselectText,
    children,
  }: PageCanvasProps) => {
    return (
      <View
        style={S.canvas}
        onStartShouldSetResponder={() => drawMode}
        onMoveShouldSetResponder={() => drawMode}
        onResponderGrant={(e) => {
          if (!drawMode) return;
          const { locationX, locationY } = e.nativeEvent;
          onDrawStart(locationX, locationY);
        }}
        onResponderMove={(e) => {
          if (!drawMode) return;
          const { locationX, locationY } = e.nativeEvent;
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
      >
        {/* SVG Layer - Dibujos */}
        <Svg style={{ position: 'absolute', inset: 0 }}>
          {/* Trazos guardados */}
          {strokes.map((s) => (
            <Path
              key={s.id}
              d={s._persistedPathD ?? pointsToPath(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              strokeOpacity={s.opacity}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Trazo actual */}
          {currentStroke && (
            <Path
              d={pointsToPath(currentStroke.points)}
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeOpacity={currentStroke.opacity}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>

        {/* Capa para deseleccionar */}
        {!drawMode && (
          <TouchableOpacity
            style={{ position: 'absolute', inset: 0 }}
            activeOpacity={1}
            onPress={onDeselectText}
          />
        )}

        {/* Capa de elementos interactivos (textos y formas) */}
        <View
          style={{ position: 'absolute', inset: 0 }}
          pointerEvents={drawMode ? 'none' : 'box-none'}
        >
          {children}
        </View>
      </View>
    );
  },
);

PageCanvas.displayName = 'PageCanvas';

export default PageCanvas;