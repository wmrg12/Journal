import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { uiColors } from '@/constants/colors';
import { TextFont, fontFamilyMap } from '@/constants/fonts';
import { updatePageText } from '@/src/db/dao';
import S from '@/styles/pageViewStyles';
import { PageText } from '@/types';

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
  canvasWidth: number;
  canvasHeight: number;
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
  canvasWidth,
  canvasHeight,
}: DraggableTextProps) => {
  const pan = useMemo(() => getPanFor(text), [getPanFor, text]);
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: text.position_x, y: text.position_y });

  // Rotación
  const [rotation, setRotation] = useState(text.rotation ?? 0);
  const rotationStartRef = useRef(rotation);
  const rotationRef = useRef(rotation);

  // Font size (resize)
  const [fontSize, setFontSize] = useState(text.font_size ?? 16);
  const fontSizeRef = useRef(fontSize);
  const fontSizeStartRef = useRef(fontSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartYRef = useRef(0);

  const lockedRef = useRef(locked);
  const textBoxRef = useRef<View>(null);
  const textCenterRef = useRef({ x: 0, y: 0 });
  const initialAngleRef = useRef(0);
  const textBoxSizeRef = useRef({ width: 0, height: 0 });

  // Double tap para editar
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_DELAY = 300;

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
    const vx = (pan.x as any)._value;
    const vy = (pan.y as any)._value;
    const dx = Math.abs(vx - text.position_x);
    const dy = Math.abs(vy - text.position_y);
    if (!isDragging && (dx > 0.5 || dy > 0.5)) {
      pan.setValue({ x: text.position_x, y: text.position_y });
      startRef.current = { x: text.position_x, y: text.position_y };
    }
  }, [text.position_x, text.position_y, pan, isDragging]);

  // PAN RESPONDER - MOVER
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !toolbarButtonPressed.current &&
        !lockedRef.current &&
        (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderGrant: () => {
        if (toolbarButtonPressed.current) return;
        onSelect(text.id);
        if (!lockedRef.current) {
          setIsDragging(true);
          startRef.current = {
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          };
          rotationStartRef.current = rotation;
        }
      },
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        const rawX = startRef.current.x + g.dx;
        const rawY = startRef.current.y + g.dy;

        if (!canvasWidth || !canvasHeight) {
          pan.setValue({ x: rawX, y: rawY });
          return;
        }

        const PADDING = 5;
        const { width: boxW, height: boxH } = textBoxSizeRef.current;
        const maxX = Math.max(PADDING, canvasWidth - PADDING - (boxW || 0));
        const maxY = Math.max(PADDING, canvasHeight - PADDING - (boxH || 0));
        const nx = Math.min(Math.max(PADDING, rawX), maxX);
        const ny = Math.min(Math.max(PADDING, rawY), maxY);
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

        console.log('Text soltado:', text.id, `(${newX}, ${newY})`);
        onPositionCommit(text.id, newX, newY);
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
        } catch (e) {
          console.error('Error updating text rotation:', e);
        }
      },
    }),
  ).current;

  // PAN RESPONDER - RESIZE 
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        setIsResizing(true);
        fontSizeStartRef.current = fontSizeRef.current;
        resizeStartYRef.current = evt.nativeEvent.pageY;
      },
      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;
        const deltaY = resizeStartYRef.current - evt.nativeEvent.pageY;
        const nextSize = Math.max(
          8,
          Math.min(72, fontSizeStartRef.current + deltaY / 4),
        );
        setFontSize(nextSize);
        fontSizeRef.current = nextSize;
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
        if (lockedRef.current || !currentPageId) return;
        try {
          await updatePageText(text.id, { font_size: fontSizeRef.current });
        } catch (e) {
          console.error('Error updating font size:', e);
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
      console.log(' Abriendo editor');
      onEdit(text);
    } else {
      onSelect(text.id);
    }

    lastTapRef.current = now;
  };

  // RENDE
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        S.textContainer,
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
      <TouchableOpacity activeOpacity={1} onPress={handleTap}>
        <View
          ref={textBoxRef}
          onLayout={(e) => {
            textBoxSizeRef.current = e.nativeEvent.layout;
          }}
          style={[
            S.textBox,
            isSelected && S.textBoxSelected,
            locked && S.textBoxLocked,
          ]}
        >
          <Text
            style={[
              S.textContent,
              {
                fontFamily:
                  fontFamilyMap[text.font_family as TextFont] ??
                  text.font_family,
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

      {/* Delete */}
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

      {/* Lock */}
      {isSelected && (
        <TouchableOpacity
          onPressIn={() => {
            toolbarButtonPressed.current = true;
          }}
          onPress={() => {
            onToggleLock(text.id);
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

      {/* Duplicate */}
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
          style={[
            S.shapeControlButton,
            S.shapeDuplicateButton,
            locked && { opacity: 0.4 },
          ]}
        >
          <MaterialIcons name="content-copy" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Rotate  */}
      {isSelected && !locked && (
        <View
          {...rotatePanResponder.panHandlers}
          style={[S.shapeControlButton, S.shapeRotateButton]}
        >
          <MaterialIcons name="rotate-right" size={16} color="#fff" />
        </View>
      )}

      {/* Resize */}
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

export const DraggableText = memo(DraggableTextBase);
