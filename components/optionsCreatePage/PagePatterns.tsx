import { uiColors } from '@/constants/colors';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Rect, Defs, Pattern, Path } from 'react-native-svg';

export type PagePattern =
  | 'none'
  | 'lines'
  | 'dots'
  | 'grid'
  | 'squared'
  | 'checkerboard'
  | 'crosses'
  | 'diamonds'
  | 'stars'
  | 'vertical'
  | 'dotscrosses'
  | 'music';

interface PagePatternBackgroundProps {
  pattern: PagePattern;
  width: number;
  height: number;
  color?: string;
}

export const PagePatternBackground: React.FC<PagePatternBackgroundProps> = ({
  pattern,
  width,
  height,
  color = uiColors.gray,
}) => {
  if (pattern === 'none' || !width || !height) {
    return null;
  }

  const renderPattern = () => {
    switch (pattern) {
      case 'lines':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="lines" patternUnits="userSpaceOnUse" width={width} height="30">
                <Line
                  x1="0"
                  y1="30"
                  x2={width}
                  y2="30"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#lines)" />
          </Svg>
        );

      case 'dots':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
                <Circle cx="10" cy="10" r="1.5" fill={color} opacity="0.4" />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#dots)" />
          </Svg>
        );

      case 'grid':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20">
                <Line x1="0" y1="0" x2="0" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
                <Line x1="0" y1="0" x2="20" y2="0" stroke={color} strokeWidth="0.5" opacity="0.3" />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#grid)" />
          </Svg>
        );

      case 'squared':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="squared" patternUnits="userSpaceOnUse" width="30" height="30">
                <Rect
                  x="0"
                  y="0"
                  width="30"
                  height="30"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#squared)" />
          </Svg>
        );

      case 'checkerboard':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="checkerboard" patternUnits="userSpaceOnUse" width="40" height="40">
                <Rect x="0" y="0" width="20" height="20" fill={color} opacity="0.15" />
                <Rect x="20" y="20" width="20" height="20" fill={color} opacity="0.15" />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#checkerboard)" />
          </Svg>
        );

      case 'crosses':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="crosses" patternUnits="userSpaceOnUse" width="25" height="25">
                {/* Cruz horizontal */}
                <Line
                  x1="7.5"
                  y1="12.5"
                  x2="17.5"
                  y2="12.5"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
                {/* Cruz vertical */}
                <Line
                  x1="12.5"
                  y1="7.5"
                  x2="12.5"
                  y2="17.5"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#crosses)" />
          </Svg>
        );

      case 'diamonds':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="diamonds" patternUnits="userSpaceOnUse" width="30" height="30">
                {/* Diamantito 1 */}
                <Path d="M 10 8 L 12 10 L 10 12 L 8 10 Z" fill={color} opacity="0.25" />
                {/* Diamantito 2 */}
                <Path d="M 24 18 L 26 20 L 24 22 L 22 20 Z" fill={color} opacity="0.25" />
                {/* Diamantito 3 */}
                <Path d="M 18 5 L 20 7 L 18 9 L 16 7 Z" fill={color} opacity="0.2" />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#diamonds)" />
          </Svg>
        );

      case 'stars':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="stars" patternUnits="userSpaceOnUse" width="40" height="40">
                {/* Estrella pequeña 1 */}
                <Path
                  d="M 10 8 L 10.5 9.5 L 12 10 L 10.5 10.5 L 10 12 L 9.5 10.5 L 8 10 L 9.5 9.5 Z"
                  fill={color}
                  opacity="0.3"
                />
                {/* Estrella pequeña 2 */}
                <Path
                  d="M 28 15 L 28.5 16.5 L 30 17 L 28.5 17.5 L 28 19 L 27.5 17.5 L 26 17 L 27.5 16.5 Z"
                  fill={color}
                  opacity="0.3"
                />
                {/* Estrella pequeña 3 */}
                <Path
                  d="M 18 28 L 18.5 29.5 L 20 30 L 18.5 30.5 L 18 32 L 17.5 30.5 L 16 30 L 17.5 29.5 Z"
                  fill={color}
                  opacity="0.3"
                />
                {/* Estrella pequeña 4 */}
                <Path
                  d="M 6 25 L 6.5 26.5 L 8 27 L 6.5 27.5 L 6 29 L 5.5 27.5 L 4 27 L 5.5 26.5 Z"
                  fill={color}
                  opacity="0.25"
                />
                {/* Estrella pequeña 5 */}
                <Path
                  d="M 32 5 L 32.5 6.5 L 34 7 L 32.5 7.5 L 32 9 L 31.5 7.5 L 30 7 L 31.5 6.5 Z"
                  fill={color}
                  opacity="0.25"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#stars)" />
          </Svg>
        );

      case 'vertical':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="vertical" patternUnits="userSpaceOnUse" width="25" height={height}>
                <Line
                  x1="25"
                  y1="0"
                  x2="25"
                  y2={height}
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#vertical)" />
          </Svg>
        );

      case 'dotscrosses':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="dotscrosses" patternUnits="userSpaceOnUse" width="30" height="30">
                {/* Punto central */}
                <Circle cx="15" cy="15" r="1.5" fill={color} opacity="0.4" />
                {/* Cruces pequeñas en las esquinas */}
                <Line x1="3" y1="6" x2="7" y2="6" stroke={color} strokeWidth="0.8" opacity="0.25" />
                <Line x1="5" y1="4" x2="5" y2="8" stroke={color} strokeWidth="0.8" opacity="0.25" />

                <Line
                  x1="23"
                  y1="6"
                  x2="27"
                  y2="6"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />
                <Line
                  x1="25"
                  y1="4"
                  x2="25"
                  y2="8"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />

                <Line
                  x1="3"
                  y1="24"
                  x2="7"
                  y2="24"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />
                <Line
                  x1="5"
                  y1="22"
                  x2="5"
                  y2="26"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />

                <Line
                  x1="23"
                  y1="24"
                  x2="27"
                  y2="24"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />
                <Line
                  x1="25"
                  y1="22"
                  x2="25"
                  y2="26"
                  stroke={color}
                  strokeWidth="0.8"
                  opacity="0.25"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#dotscrosses)" />
          </Svg>
        );

      case 'music':
        return (
          <Svg width={width} height={height} style={styles.svg}>
            <Defs>
              <Pattern id="music" patternUnits="userSpaceOnUse" width={width} height="40">
                {/* Pentagrama */}
                <Line
                  x1="0"
                  y1="8"
                  x2={width}
                  y2="8"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <Line
                  x1="0"
                  y1="14"
                  x2={width}
                  y2="14"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <Line
                  x1="0"
                  y1="20"
                  x2={width}
                  y2="20"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <Line
                  x1="0"
                  y1="26"
                  x2={width}
                  y2="26"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <Line
                  x1="0"
                  y1="32"
                  x2={width}
                  y2="32"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </Pattern>
            </Defs>
            <Rect width={width} height={height} fill="url(#music)" />
          </Svg>
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderPattern()}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svg: {
    position: 'absolute',
  },
});

export const PAGE_PATTERNS: PagePattern[] = [
  'none',
  'lines',
  'dots',
  'grid',
  'squared',
  'checkerboard',
  'crosses',
  'diamonds',
  'stars',
  'vertical',
  'dotscrosses',
  'music',
];

export const PATTERN_NAMES: Record<PagePattern, string> = {
  none: 'Sin patrón',
  lines: 'Líneas',
  dots: 'Puntos',
  grid: 'Cuadrícula',
  squared: 'Cuadrados',
  checkerboard: 'Ajedrez',
  crosses: 'Cruces',
  diamonds: 'Diamantes',
  stars: 'Estrellas',
  vertical: 'Verticales',
  dotscrosses: 'Puntos+Cruz',
  music: 'Pentagrama',
};
