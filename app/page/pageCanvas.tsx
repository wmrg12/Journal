import React, { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import S from '../../styles/pageViewStyles';

type Stroke = {
  id: string;
  tool: string;
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
  _persistedPathD?: string;
};

type PageCanvasProps = {
  drawMode: boolean;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  pointsToPath: (pts: { x: number; y: number }[]) => string;
  onDrawStart: (x: number, y: number) => void;
  onLayoutCanvas?: (size: { width: number; height: number }) => void;
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
    onLayoutCanvas,
    onDrawMove,
    onDrawEnd,
    onDeselectText,
    children,
  }: PageCanvasProps) => {
    return (
      <View style={S.canvasWrapper}>
        <View
          style={S.canvas}
          onStartShouldSetResponder={() => drawMode}
          onMoveShouldSetResponder={() => drawMode}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            onLayoutCanvas?.({ width, height });
          }}
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
          <Svg style={{ position: 'absolute', inset: 0 }}>
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

          {/* deseleccionar texto */}
          {!drawMode && (
            <TouchableOpacity
              style={{ position: 'absolute', inset: 0 }}
              activeOpacity={1}
              onPress={onDeselectText}
            />
          )}

          {/* textos */}
          <View
            style={{ position: 'absolute', inset: 0 }}
            pointerEvents={drawMode ? 'none' : 'box-none'}
          >
            {children}
          </View>
        </View>
      </View>
    );
  },
);

PageCanvas.displayName = 'PageCanvas';

export default PageCanvas;
