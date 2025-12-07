import { uiColors } from '@/constants/colors';
import { PageShape, updatePageShape } from '@/src/db/dao';
import S from '@/styles/pageViewStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

type DraggableShapeProps = {
  shape: PageShape;
  currentPageId: string | null;
  handleDeleteShape: (id: string) => void;
  getPanFor: (s: PageShape) => Animated.ValueXY;
  onPositionCommit: (id: string, x: number, y: number) => void;
  locked: boolean;
  isSelected: boolean;
  onToggleLock: (id: string) => void;
  onSelect: (id: string) => void;
  onDuplicate: (s: PageShape) => void;
  onDoublePress?: (shape: PageShape) => void;
  canvasWidth: number;
  canvasHeight: number;
};

const DraggableShapeBase = ({
  shape,
  currentPageId,
  handleDeleteShape,
  getPanFor,
  onPositionCommit,
  locked,
  isSelected,
  onToggleLock,
  onSelect,
  onDuplicate,
  onDoublePress,
  canvasWidth,
  canvasHeight,
}: DraggableShapeProps) => {
  const pan = getPanFor(shape);

  // Estado y refs para drag
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: shape.position_x, y: shape.position_y });

  // Rotación
  const [rotation, setRotation] = useState(shape.rotation ?? 0);
  const rotationStartRef = useRef(rotation);
  const rotationRef = useRef(rotation);

  // Tamaño
  const [width, setWidth] = useState(shape.width ?? 300);
  const [height, setHeight] = useState(shape.height ?? 800);
  const sizeStartRef = useRef({ width, height });
  const sizeRef = useRef({ width, height });

  const lockedRef = useRef(locked);
  const shapeBoxRef = useRef<View>(null);
  const shapeCenterRef = useRef({ x: 0, y: 0 });
  const initialAngleRef = useRef(0);

  const [isResizing, setIsResizing] = useState(false);

  // Double tap para cambiar color
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_DELAY = 300;
  
  // Para pinch
  const pinchInitialDistanceRef = useRef(0);

  //  Validación de posición
  const hasValidatedPosition = useRef(false);

  useEffect(() => {
    sizeRef.current = { width, height };
  }, [width, height]);

  // Sync de props -> refs/estado
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    setRotation(shape.rotation ?? 0);
  }, [shape.rotation]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    setWidth(shape.width ?? 100);
    setHeight(shape.height ?? 100);
  }, [shape.width, shape.height]);

  useEffect(() => {
    sizeRef.current = { width, height };
  }, [width, height]);

  // Sync posición desde BD
  useEffect(() => {
    const vx = (pan.x as any)._value;
    const vy = (pan.y as any)._value;
    const dx = Math.abs(vx - shape.position_x);
    const dy = Math.abs(vy - shape.position_y);
    if (!isDragging && (dx > 0.5 || dy > 0.5)) {
      pan.setValue({ x: shape.position_x, y: shape.position_y });
      startRef.current = { x: shape.position_x, y: shape.position_y };
    }
  }, [shape.position_x, shape.position_y, pan, isDragging]);

  // VALIDACIÓN AUTOMÁTICA 
  useEffect(() => {
    if (
      !hasValidatedPosition.current &&
      canvasWidth > 0 &&
      canvasHeight > 0 &&
      width > 0 &&
      height > 0
    ) {
      const currentX = (pan.x as any)._value;
      const currentY = (pan.y as any)._value;
      let validX = Math.max(0, Math.min(currentX, canvasWidth - width));
      let validY = Math.max(0, Math.min(currentY, canvasHeight - height));
      if (validX !== currentX || validY !== currentY) {
        console.log(' Corrigiendo shape fuera de límites:', shape.id);
        pan.setValue({ x: validX, y: validY });

        if (currentPageId) {
          updatePageShape(shape.id, {
            position_x: validX,
            position_y: validY,
          }).catch(console.error);
        }
      }

      hasValidatedPosition.current = true;
    }
  }, [canvasWidth, canvasHeight, shape.id, width, height, pan, currentPageId]);

  // PanResponder para mover (drag con un dedo) 
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (toolbarButtonPressed.current || lockedRef.current) return false;
        if (g.numberActiveTouches !== 1) return false;
        return Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3;
      },
      onPanResponderGrant: () => {
        if (toolbarButtonPressed.current) return;

        setIsDragging(true);
        startRef.current = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };
      },
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;

        // Calcular nueva posición
        let nx = startRef.current.x + g.dx;
        let ny = startRef.current.y + g.dy;

        // APLICAR LÍMITES DEL CANVAS
        if (canvasWidth > 0) {
          nx = Math.max(0, Math.min(nx, canvasWidth - sizeRef.current.width));
        }
        if (canvasHeight > 0) {
          ny = Math.max(0, Math.min(ny, canvasHeight - sizeRef.current.height));
        }

        pan.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: async () => {
        if (toolbarButtonPressed.current) {
          toolbarButtonPressed.current = false;
          return;
        }

        setIsDragging(false);
        if (lockedRef.current) return;

        const newX = (pan.x as any)._value;
        const newY = (pan.y as any)._value;
        onPositionCommit(shape.id, newX, newY);

        if (currentPageId) {
          try {
            await updatePageShape(shape.id, {
              position_x: newX,
              position_y: newY,
            });
          } catch (e) {
            console.error('Error updating shape position:', e);
          }
        }
      },
    }),
  ).current;

  // PanResponder para rotar 
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        rotationStartRef.current = rotationRef.current;

        shapeBoxRef.current?.measureInWindow((x, y, w, h) => {
          shapeCenterRef.current = {
            x: x + w / 2,
            y: y + h / 2,
          };

          const { pageX, pageY } = evt.nativeEvent;
          const dx = pageX - shapeCenterRef.current.x;
          const dy = pageY - shapeCenterRef.current.y;
          initialAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        });
      },
      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - shapeCenterRef.current.x;
        const dy = pageY - shapeCenterRef.current.y;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const angleDelta = currentAngle - initialAngleRef.current;

        const newRotation = rotationStartRef.current + angleDelta;
        setRotation(newRotation);
        rotationRef.current = newRotation;
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        if (lockedRef.current || !currentPageId) return;

        try {
          await updatePageShape(shape.id, {
            rotation: rotationRef.current,
          });
        } catch (e) {
          console.error('Error updating shape rotation:', e);
        }
      },
    }),
  ).current;

  // PanResponder para redimensionar con drag 
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        setIsResizing(true);
        sizeStartRef.current = {
          width: sizeRef.current.width,
          height: sizeRef.current.height,
        };
      },
      onPanResponderMove: (evt, g) => {
        if (lockedRef.current) return;

        const deltaX = g.dx;
        const deltaY = g.dy;

        let newWidth = Math.max(60, sizeStartRef.current.width + deltaX);
        let newHeight = Math.max(60, sizeStartRef.current.height + deltaY);

        // VALIDAR LÍMITES DEL CANVAS
        if (canvasWidth > 0) {
          const currentX = (pan.x as any)._value;
          const maxWidth = canvasWidth - currentX;
          newWidth = Math.min(newWidth, maxWidth);
        }

        if (canvasHeight > 0) {
          const currentY = (pan.y as any)._value;
          const maxHeight = canvasHeight - currentY;
          newHeight = Math.min(newHeight, maxHeight);
        }

        // Aplicar límites mínimos
        newWidth = Math.max(60, newWidth);
        newHeight = Math.max(60, newHeight);

        setWidth(newWidth);
        setHeight(newHeight);
        sizeRef.current = { width: newWidth, height: newHeight };
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
        if (lockedRef.current || !currentPageId) return;

        try {
          await updatePageShape(shape.id, {
            width: sizeRef.current.width,
            height: sizeRef.current.height,
          });
        } catch (e) {
          console.error('Error updating shape size:', e);
        }
      },
    }),
  ).current;

  // PanResponder para redimensionar con pinch
  const pinchPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !lockedRef.current && g.numberActiveTouches >= 2,

      onPanResponderGrant: (evt, g) => {
        if (lockedRef.current || g.numberActiveTouches < 2) return;

        toolbarButtonPressed.current = true;
        setIsResizing(true);

        sizeStartRef.current = {
          width: sizeRef.current.width,
          height: sizeRef.current.height,
        };

        const touches = evt.nativeEvent.touches;
        if (touches.length < 2) return;

        const [t1, t2] = touches;
        const dx = t2.pageX - t1.pageX;
        const dy = t2.pageY - t1.pageY;
        const initialDistance = Math.sqrt(dx * dx + dy * dy);
        pinchInitialDistanceRef.current = initialDistance;
      },

      onPanResponderMove: (evt, g) => {
        if (lockedRef.current || g.numberActiveTouches < 2) return;

        const touches = evt.nativeEvent.touches;
        if (touches.length < 2) return;

        const [t1, t2] = touches;
        const dx = t2.pageX - t1.pageX;
        const dy = t2.pageY - t1.pageY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        const initialDistance =
          pinchInitialDistanceRef.current || currentDistance;

        const scale = currentDistance / initialDistance;

        let newWidth = Math.max(30, sizeStartRef.current.width * scale);
        let newHeight = Math.max(30, sizeStartRef.current.height * scale);

        // VALIDAR LÍMITES DEL CANVAS
        if (canvasWidth > 0) {
          const currentX = (pan.x as any)._value;
          const maxWidth = canvasWidth - currentX;
          newWidth = Math.min(newWidth, maxWidth);
        }

        if (canvasHeight > 0) {
          const currentY = (pan.y as any)._value;
          const maxHeight = canvasHeight - currentY;
          newHeight = Math.min(newHeight, maxHeight);
        }

        // Aplicar límites mínimos
        newWidth = Math.max(30, newWidth);
        newHeight = Math.max(30, newHeight);

        setWidth(newWidth);
        setHeight(newHeight);
        sizeRef.current = { width: newWidth, height: newHeight };
      },

      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
        if (lockedRef.current || !currentPageId) return;

        try {
          await updatePageShape(shape.id, {
            width: sizeRef.current.width,
            height: sizeRef.current.height,
          });
        } catch (e) {
          console.error('Error updating shape size (pinch):', e);
        }
      },
    }),
  ).current;

  // Renderizar la forma SVG según el tipo
  const renderShape = () => {
    const w = width;
    const h = height;
    const color = shape.color;

    switch (shape.shape_type) {
      case 'line':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Line
              x1="0"
              y1={h / 2}
              x2={w}
              y2={h / 2}
              stroke={color}
              strokeWidth="4"
            />
          </Svg>
        );

      case 'arrow':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Line
              x1="0"
              y1={h / 2}
              x2={w - 20}
              y2={h / 2}
              stroke={color}
              strokeWidth="4"
            />
            <Polygon
              points={`${w},${h / 2} ${w - 20},${h / 2 - 10} ${
                w - 20
              },${h / 2 + 10}`}
              fill={color}
            />
          </Svg>
        );

      case 'circle':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Circle
              cx={w / 2}
              cy={h / 2}
              r={Math.min(w, h) / 2}
              fill={color}
            />
          </Svg>
        );

      case 'square':
      case 'rectangle':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Rect x={0} y={0} width={w} height={h} fill={color} />
          </Svg>
        );

      case 'triangle':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon
              points={`${w / 2},0 ${w},${h} 0,${h}`}
              fill={color}
            />
          </Svg>
        );

      case 'star': {
        const cx = w / 2;
        const cy = h / 2;
        const outerRadius = Math.min(w, h) / 2;
        const innerRadius = outerRadius * 0.4;
        const points: string[] = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          points.push(
            `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`,
          );
        }
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon points={points.join(' ')} fill={color} />
          </Svg>
        );
      }

      case 'heart':
        return (
          <Svg width={w} height={h} viewBox="0 0 100 100">
            <Path
              d="M50,90 C50,90 10,65 10,40 C10,25 20,15 30,15 C40,15 50,25 50,25 C50,25 60,15 70,15 C80,15 90,25 90,40 C90,65 50,90 50,90 Z"
              fill={color}
            />
          </Svg>
        );

      case 'diamond':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon
              points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
              fill={color}
            />
          </Svg>
        );

      case 'pentagon': {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) / 2;
        const points: string[] = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          points.push(
            `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`,
          );
        }
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon points={points.join(' ')} fill={color} />
          </Svg>
        );
      }

      case 'sun': {
        const cx = w / 2;
        const cy = h / 2;
        const innerRadius = Math.min(w, h) / 4;
        const outerRadius = Math.min(w, h) / 2;
        const points: string[] = [];
        for (let i = 0; i < 16; i++) {
          const angle = (i * Math.PI) / 8;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          points.push(
            `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`,
          );
        }
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon points={points.join(' ')} fill={color} />
          </Svg>
        );
      }

      case 'bolt':
        return (
          <Svg width={w} height={h} viewBox="0 0 100 100">
            <Path
              d="M55,0 L20,50 L40,50 L30,100 L75,40 L50,40 Z"
              fill={color}
            />
          </Svg>
        );

      case 'flower': {
        const cx = w / 2;
        const cy = h / 2;
        const petalRadius = Math.min(w, h) / 4;
        const centerRadius = petalRadius * 0.4;
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const px = cx + petalRadius * Math.cos(rad);
              const py = cy + petalRadius * Math.sin(rad);
              return (
                <Circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={petalRadius * 0.6}
                  fill={color}
                  opacity={0.8}
                />
              );
            })}
            <Circle cx={cx} cy={cy} r={centerRadius} fill={color} />
          </Svg>
        );
      }

      case 'mountain':
        return (
          <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Polygon
              points={`0,${h} ${w * 0.3},${h * 0.3} ${w * 0.5},${h}`}
              fill={color}
              opacity={0.7}
            />
            <Polygon
              points={`${w * 0.2},${h} ${w * 0.6},0 ${w},${h}`}
              fill={color}
            />
          </Svg>
        );

      default:
        return null;
    }
  };

  // HANDLERS
  const handleTap = () => {
    if (toolbarButtonPressed.current) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && isSelected && !lockedRef.current) {
      // Double tap: abrir modal de color
      onDoublePress?.(shape);
    } else {
      // Single tap: seleccionar
      onSelect(shape.id);
    }

    lastTapRef.current = now;
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        S.shapeContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${rotation}deg` },
          ],
          opacity: isDragging ? 0.7 : 1,
          zIndex: isSelected ? 1000 : 1,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
      >
        <View
          ref={shapeBoxRef}
          {...pinchPanResponder.panHandlers}
          style={[
            S.shapeBox,
            isSelected && S.shapeBoxSelected,
            {
              padding: 0,
              backgroundColor: 'transparent',
              width,
              height,
            },
          ]}
        >
          {renderShape()}
        </View>
      </TouchableOpacity>

      {isSelected && (
        <TouchableOpacity
          onPressIn={() => {
            toolbarButtonPressed.current = true;
          }}
          onPress={() => {
            handleDeleteShape(shape.id);
            toolbarButtonPressed.current = false;
          }}
          style={[S.shapeControlButton, S.shapeDeleteButton]}
        >
          <MaterialIcons name="delete" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {isSelected && (
        <TouchableOpacity
          onPressIn={() => {
            toolbarButtonPressed.current = true;
          }}
          onPress={() => {
            onToggleLock(shape.id);
            toolbarButtonPressed.current = false;
          }}
          style={[
            S.shapeControlButton,
            S.shapeLockButton,
            locked && S.shapeLockButtonLocked,
          ]}
        >
          <MaterialIcons
            name={locked ? 'lock' : 'lock-open'}
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {isSelected && !locked && (
        <TouchableOpacity
          onPressIn={() => {
            toolbarButtonPressed.current = true;
          }}
          onPress={() => {
            if (lockedRef.current) {
              toolbarButtonPressed.current = false;
              return;
            }
            onDuplicate(shape);
            toolbarButtonPressed.current = false;
          }}
          style={[
            S.shapeControlButton,
            S.shapeDuplicateButton,
            locked && { opacity: 0.4 },
          ]}
        >
          <MaterialIcons name="content-copy" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {isSelected && !locked && (
        <View
          {...rotatePanResponder.panHandlers}
          style={[S.shapeControlButton, S.shapeRotateButton]}
        >
          <MaterialIcons name="rotate-right" size={16} color="#fff" />
        </View>
      )}

      {isSelected && !locked && (
        <View
          {...resizePanResponder.panHandlers}
          style={S.shapeResizeHandle}
          pointerEvents="auto"
        >
          <View
            style={[
              S.shapeResizeHandleInner,
              isResizing && { backgroundColor: uiColors.primary },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
};

export const DraggableShape = memo(DraggableShapeBase);