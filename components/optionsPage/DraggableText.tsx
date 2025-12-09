import { uiColors } from '@/constants/colors';
import { TextFont, fontFamilyMap } from '@/constants/fonts';
import { updatePageText } from '@/src/db/dao';
import S from '@/styles/pageViewStyles';
import { PageText } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Text, TouchableOpacity, View } from 'react-native';

type DraggableTextProps = {
  text: PageText;
  currentPageId: string | null;
  handleDeleteText: (id: string) => void;
  getPanFor: (t: PageText) => Animated.ValueXY;
  onPositionCommit: (id: string, x: number, y: number) => void;
  locked: boolean;
  isSelected: boolean;
  onToggleLock: (id: string) => void;
  onSelect: (id: string) => void;
  onEdit: (t: PageText) => void;
  onDuplicate: (t: PageText) => void;
  onRotationChange?: (id: string, rotation: number) => void;
  onFontSizeChange?: (id: string, fontSize: number) => void;
  canvasWidth: number;
  canvasHeight: number;
  zIndex?: number;
};

const DraggableTextBase = ({
  text,
  currentPageId,
  handleDeleteText,
  getPanFor,
  onPositionCommit,
  locked,
  isSelected,
  onToggleLock,
  onSelect,
  onEdit,
  onDuplicate,
  onRotationChange,
  onFontSizeChange,
  canvasWidth,
  canvasHeight,
  zIndex = 5,
}: DraggableTextProps) => {
  const pan = useMemo(() => getPanFor(text), [getPanFor, text]);
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: text.position_x, y: text.position_y });

  // Rotación
  const [rotation, setRotation] = useState(text.rotation ?? 0);
  const rotationStartRef = useRef(rotation);
  const rotationRef = useRef(rotation);

  // Font size (resize vertical)
  const [fontSize, setFontSize] = useState(text.font_size ?? 16);
  const fontSizeRef = useRef(fontSize);
  const fontSizeStartRef = useRef(fontSize);

  // Ancho máximo del texto (resize horizontal)
  const [maxWidth, setMaxWidth] = useState(text.text_width ?? 300);
  const maxWidthRef = useRef(maxWidth);
  const maxWidthStartRef = useRef(maxWidth);

  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0 });

  const lockedRef = useRef(locked);
  const textBoxRef = useRef<View>(null);
  const textCenterRef = useRef({ x: 0, y: 0 });
  const initialAngleRef = useRef(0);
  const textBoxSizeRef = useRef({ width: 0, height: 0 });

  // Double tap para editar
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_DELAY = 300;

  // Validación de posición
  const hasValidatedPosition = useRef(false);

  // EFFECTS - SYNC
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (typeof text.font_size === 'number') {
      setFontSize(text.font_size);
      fontSizeRef.current = text.font_size;
    }
  }, [text.font_size]);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  useEffect(() => {
    maxWidthRef.current = maxWidth;
  }, [maxWidth]);

  // Sincronizar ancho desde la BD
  useEffect(() => {
    if (text.text_width !== undefined && text.text_width !== maxWidth) {
      setMaxWidth(text.text_width);
      maxWidthRef.current = text.text_width;
    }
  }, [text.text_width]);

  useEffect(() => {
    const vx = (pan.x as any)._value;
    const vy = (pan.y as any)._value;
    const dx = Math.abs(vx - text.position_x);
    const dy = Math.abs(vy - text.position_y);
    if (!isDragging && (dx > 0.5 || dy > 0.5)) {
      pan.setValue({ x: text.position_x, y: text.position_y });
      startRef.current = { x: text.position_x, y: text.position_y };
    }
  }, [text.position_x, text.position_y, pan, isDragging]);

  // VALIDACIÓN AUTOMÁTICA
  useEffect(() => {
    if (
      !hasValidatedPosition.current &&
      canvasWidth > 0 &&
      canvasHeight > 0 &&
      textBoxSizeRef.current.width > 0 &&
      textBoxSizeRef.current.height > 0
    ) {
      const currentX = (pan.x as any)._value;
      const currentY = (pan.y as any)._value;
      const { width: boxW, height: boxH } = textBoxSizeRef.current;

      let validX = currentX;
      let validY = currentY;

      if (boxW > 0) {
        validX = Math.max(0, Math.min(currentX, canvasWidth - boxW));
      }
      if (boxH > 0) {
        validY = Math.max(0, Math.min(currentY, canvasHeight - boxH));
      }

      if (validX !== currentX || validY !== currentY) {
        console.log('Corrigiendo texto fuera de límites:', text.id);
        pan.setValue({ x: validX, y: validY });

        if (currentPageId) {
          updatePageText(text.id, {
            position_x: validX,
            position_y: validY,
          }).catch(console.error);
        }
      }

      hasValidatedPosition.current = true;
    }
  }, [canvasWidth, canvasHeight, text.id, pan, currentPageId]);

  // PAN RESPONDER - MOVER
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

        let nx = startRef.current.x + g.dx;
        let ny = startRef.current.y + g.dy;

        if (canvasWidth > 0) {
          const { width: boxW } = textBoxSizeRef.current;
          nx = Math.max(0, Math.min(nx, canvasWidth - (boxW || 0)));
        }
        if (canvasHeight > 0) {
          const { height: boxH } = textBoxSizeRef.current;
          ny = Math.max(0, Math.min(ny, canvasHeight - (boxH || 0)));
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
        onPositionCommit(text.id, newX, newY);

        if (currentPageId) {
          try {
            await updatePageText(text.id, {
              position_x: newX,
              position_y: newY,
            });
          } catch (e) {
            console.error('Error updating text position:', e);
          }
        }
      },
    }),
  ).current;

  // PAN RESPONDER - ROTAR
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        rotationStartRef.current = rotationRef.current;

        textBoxRef.current?.measureInWindow((x, y, width, height) => {
          textCenterRef.current = { x: x + width / 2, y: y + height / 2 };
          const { pageX, pageY } = evt.nativeEvent;
          const dx = pageX - textCenterRef.current.x;
          const dy = pageY - textCenterRef.current.y;
          initialAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        });
      },
      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - textCenterRef.current.x;
        const dy = pageY - textCenterRef.current.y;
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
          await updatePageText(text.id, { rotation: rotationRef.current });
          onRotationChange?.(text.id, rotationRef.current);
        } catch (e) {
          console.error('Error updating text rotation:', e);
        }
      },
    }),
  ).current;

  // PAN RESPONDER - RESIZE (diagonal: ancho + altura)
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        setIsResizing(true);
        fontSizeStartRef.current = fontSizeRef.current;
        maxWidthStartRef.current = maxWidthRef.current;
        resizeStartRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
        };
      },
      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;

        const deltaX = evt.nativeEvent.pageX - resizeStartRef.current.x;
        const deltaY = evt.nativeEvent.pageY - resizeStartRef.current.y;

        let nextWidth = Math.max(80, maxWidthStartRef.current + deltaX);

        let nextFontSize = Math.max(8, fontSizeStartRef.current + deltaY / 4);

        if (canvasWidth > 0) {
          const currentX = (pan.x as any)._value;
          nextWidth = Math.min(nextWidth, canvasWidth - currentX - 10);
        }

        nextFontSize = Math.max(8, Math.min(72, nextFontSize));

        setMaxWidth(nextWidth);
        setFontSize(nextFontSize);
        maxWidthRef.current = nextWidth;
        fontSizeRef.current = nextFontSize;
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
        if (lockedRef.current || !currentPageId) return;
        try {
          await updatePageText(text.id, {
            font_size: fontSizeRef.current,
            text_width: maxWidthRef.current,
          });
          onFontSizeChange?.(text.id, fontSizeRef.current);
        } catch (e) {
          console.error('Error updating text:', e);
        }
      },
      onPanResponderTerminate: () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
      },
    }),
  ).current;

  // HANDLERS
  const handleTap = () => {
    if (toolbarButtonPressed.current) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && isSelected && !lockedRef.current) {
      console.log('Abriendo editor');
      onEdit(text);
    } else {
      onSelect(text.id);
    }

    lastTapRef.current = now;
  };

  // RENDER
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        S.textContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: `${rotation}deg` }],
          opacity: isDragging ? 0.7 : 1,
          zIndex: isSelected ? zIndex + 10000 : zIndex,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={1} onPress={handleTap}>
        <View
          ref={textBoxRef}
          onLayout={(e) => {
            textBoxSizeRef.current = e.nativeEvent.layout;
          }}
          style={[
            S.textBox,
            {
              maxWidth: maxWidth,
            },
            isSelected && { borderWidth: 2, borderColor: uiColors.primary, borderStyle: 'dashed' },
            locked && S.textBoxLocked,
          ]}
        >
          <Text
            style={[
              S.textContent,
              {
                fontFamily: fontFamilyMap[text.font_family as TextFont] ?? text.font_family,
                color: text.color,
                fontSize: fontSize,
              },
            ]}
          >
            {text.content}
          </Text>
        </View>
      </TouchableOpacity>

      {/* BOTONES FLOTANTES */}

      {isSelected && (
        <TouchableOpacity
          onPressIn={() => {
            toolbarButtonPressed.current = true;
          }}
          onPress={() => {
            handleDeleteText(text.id);
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
            onToggleLock(text.id);
            toolbarButtonPressed.current = false;
          }}
          style={[S.shapeControlButton, S.shapeLockButton, locked && S.shapeLockButtonLocked]}
        >
          <MaterialIcons name={locked ? 'lock' : 'lock-open'} size={16} color="#fff" />
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
            onDuplicate(text);
            toolbarButtonPressed.current = false;
          }}
          style={[S.shapeControlButton, S.shapeDuplicateButton, locked && { opacity: 0.4 }]}
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
        <View {...resizePanResponder.panHandlers} style={S.shapeResizeHandle} pointerEvents="auto">
          <View
            style={[S.shapeResizeHandleInner, isResizing && { backgroundColor: uiColors.primary }]}
          />
        </View>
      )}
    </Animated.View>
  );
};

export const DraggableText = memo(DraggableTextBase);
