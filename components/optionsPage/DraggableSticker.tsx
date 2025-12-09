import { STICKER_SOURCES } from '@/constants/stickers';
import { PageSticker } from '@/src/db/dao';
import pageStyles from '@/styles/pageViewStyles';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  TouchableOpacity,
  View,
} from 'react-native';

interface PageStickerComponentProps {
  sticker: PageSticker;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: {
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  scale?: number;
  zIndex?: number;
}

export function PageStickerComponent({
  sticker,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleLock,
  scale = 1,
  zIndex = 4, 
}: PageStickerComponentProps) {
  const isLockedRef = useRef(sticker.is_locked);
  
  const pan = useRef(new Animated.ValueXY({
    x: Number(sticker.position_x) || 0,
    y: Number(sticker.position_y) || 0,
  })).current;
  
  const [localSize, setLocalSize] = useState({
    width: Number(sticker.width) || 100,
    height: Number(sticker.height) || 100,
  });
  
  const [localRotation, setLocalRotation] = useState(Number(sticker.rotation) || 0);

  const lastPan = useRef({ x: Number(sticker.position_x) || 0, y: Number(sticker.position_y) || 0 });
  const lastSize = useRef({ width: Number(sticker.width) || 100, height: Number(sticker.height) || 100 });
  const lastRotation = useRef(Number(sticker.rotation) || 0);
  const rotationStartRef = useRef(Number(sticker.rotation) || 0);
  const currentPosition = useRef({ x: Number(sticker.position_x) || 0, y: Number(sticker.position_y) || 0 });
  const currentSize = useRef({ width: Number(sticker.width) || 100, height: Number(sticker.height) || 100 });
  const currentRotation = useRef(Number(sticker.rotation) || 0);
  const isGestureActive = useRef(false);
  const toolbarButtonPressed = useRef(false);
  const stickerBoxRef = useRef<View | null>(null);
  const stickerCenterRef = useRef({ x: 0, y: 0 });
  const initialAngleRef = useRef(0);
  const sizeStartRef = useRef({ width: Number(sticker.width) || 100, height: Number(sticker.height) || 100 });

  useEffect(() => {
    isLockedRef.current = sticker.is_locked;
    console.log('Lock actualizado:', sticker.id.substring(0, 8), '->', sticker.is_locked);
  }, [sticker.is_locked, sticker.id]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        if (isLockedRef.current) return false;
        if (toolbarButtonPressed.current) return false;
        return false;
      },
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        if (isLockedRef.current) return false;
        if (toolbarButtonPressed.current) return false;
        if (gestureState.numberActiveTouches !== 1) return false;
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (isLockedRef.current) {
          console.log('Intento de mover sticker bloqueado');
          return;
        }
        onSelect();
        isGestureActive.current = true;
        lastPan.current = { x: (pan.x as any)._value, y: (pan.y as any)._value };
      },
      onPanResponderMove: (evt, gesture) => {
        if (isLockedRef.current) return;
        const nx = lastPan.current.x + gesture.dx / scale;
        const ny = lastPan.current.y + gesture.dy / scale;
        pan.setValue({ x: nx, y: ny });
        currentPosition.current = { x: nx, y: ny };
      },
      onPanResponderRelease: () => {
        if (isLockedRef.current) return;
        isGestureActive.current = false;
        const finalX = (pan.x as any)._value;
        const finalY = (pan.y as any)._value;
        onUpdate({ position_x: Number(finalX), position_y: Number(finalY) });
      },
    }),
  ).current;

  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLockedRef.current,
      onMoveShouldSetPanResponder: () => !isLockedRef.current,
      onPanResponderGrant: () => {
        if (isLockedRef.current) return;
        toolbarButtonPressed.current = true;
        isGestureActive.current = true;
        lastSize.current = { width: Number(currentSize.current.width), height: Number(currentSize.current.height) };
        sizeStartRef.current = { width: currentSize.current.width, height: currentSize.current.height };
      },
      onPanResponderMove: (_, gesture) => {
        if (isLockedRef.current) return;
        const newWidth = Math.max(30, sizeStartRef.current.width + gesture.dx / scale);
        const newHeight = Math.max(30, sizeStartRef.current.height + gesture.dy / scale);
        setLocalSize({ width: newWidth, height: newHeight });
        currentSize.current = { width: newWidth, height: newHeight };
      },
      onPanResponderRelease: () => {
        if (isLockedRef.current) return;
        isGestureActive.current = false;
        toolbarButtonPressed.current = false;
        lastSize.current = { width: currentSize.current.width, height: currentSize.current.height };
        onUpdate({ width: Number(currentSize.current.width), height: Number(currentSize.current.height) });
      },
    }),
  ).current;

  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLockedRef.current,
      onMoveShouldSetPanResponder: () => !isLockedRef.current,
      onPanResponderGrant: (evt) => {
        if (isLockedRef.current) return;
        toolbarButtonPressed.current = true;
        isGestureActive.current = true;
        rotationStartRef.current = Number(localRotation) || 0;
        stickerBoxRef.current?.measureInWindow((x, y, w, h) => {
          stickerCenterRef.current = { x: x + w / 2, y: y + h / 2 };
          const { pageX, pageY } = evt.nativeEvent as any;
          const dx = pageX - (x + w / 2);
          const dy = pageY - (y + h / 2);
          initialAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        });
      },
      onPanResponderMove: (evt) => {
        if (isLockedRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - stickerCenterRef.current.x;
        const dy = pageY - stickerCenterRef.current.y;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (!initialAngleRef.current) {
          initialAngleRef.current = currentAngle;
        }
        const angleDelta = currentAngle - initialAngleRef.current;
        const newRotation = rotationStartRef.current + angleDelta;
        setLocalRotation(newRotation);
        currentRotation.current = newRotation;
      },
      onPanResponderRelease: () => {
        if (isLockedRef.current) return;
        toolbarButtonPressed.current = false;
        isGestureActive.current = false;
        onUpdate({ rotation: Number(currentRotation.current) });
      },
    }),
  ).current;

  useEffect(() => {
    if (isGestureActive.current) return;

    const px = Number(sticker.position_x) || 0;
    const py = Number(sticker.position_y) || 0;
    const w = Number(sticker.width) || 100;
    const h = Number(sticker.height) || 100;
    const r = Number(sticker.rotation) || 0;

    pan.setValue({ x: px, y: py });
    setLocalSize({ width: w, height: h });
    setLocalRotation(r);
    lastPan.current = { x: px, y: py };
    lastSize.current = { width: w, height: h };
    lastRotation.current = r;
    currentPosition.current = { x: px, y: py };
    currentSize.current = { width: w, height: h };
    currentRotation.current = r;
  }, [sticker.position_x, sticker.position_y, sticker.width, sticker.height, sticker.rotation, pan]);

  const handleDelete = () => {
    Alert.alert('Eliminar Sticker', '¿Estas seguro de que quieres eliminar este sticker?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  const stickerSource = STICKER_SOURCES[sticker.sticker_url as keyof typeof STICKER_SOURCES] || STICKER_SOURCES.sticker1;

  return (
    <Animated.View
      ref={stickerBoxRef}
      style={[
        pageStyles.stickerContainer,
        {
          width: localSize.width,
          height: localSize.height,
          zIndex: isSelected ? zIndex + 10000 : zIndex,
          elevation: isSelected ? zIndex + 10000 : zIndex,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${localRotation}deg` },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onPress={() => { if (!toolbarButtonPressed.current) { onSelect(); } }}>
        <Image source={stickerSource} style={pageStyles.stickerImage} resizeMode="contain" />
      </TouchableOpacity>

      {isSelected && (
        <>
          <View style={pageStyles.stickerSelectionBorder} />

          <TouchableOpacity
            onPressIn={() => {
              toolbarButtonPressed.current = true;
            }}
            onPress={() => {
              handleDelete();
              toolbarButtonPressed.current = false;
            }}
            style={[pageStyles.stickerControlButton, pageStyles.shapeDeleteButton]}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPressIn={() => {
              toolbarButtonPressed.current = true;
            }}
            onPress={() => {
              onToggleLock();
              toolbarButtonPressed.current = false;
            }}
            style={[
              pageStyles.stickerControlButton,
              pageStyles.shapeLockButton,
              sticker.is_locked ? pageStyles.shapeLockButtonLocked : undefined,
            ]}
          >
            <MaterialIcons
              name={!!sticker.is_locked ? 'lock' : 'lock-open'}
              size={16}
              color="#fff"
            />
          </TouchableOpacity>

          {!sticker.is_locked && (
            <>
              <TouchableOpacity
                onPressIn={() => {
                  toolbarButtonPressed.current = true;
                }}
                onPress={() => {
                  onDuplicate();
                  toolbarButtonPressed.current = false;
                }}
                style={[pageStyles.stickerControlButton, pageStyles.shapeDuplicateButton]}
              >
                <MaterialIcons name="content-copy" size={16} color="#fff" />
              </TouchableOpacity>

              <View
                style={[pageStyles.stickerControlButton, pageStyles.shapeRotateButton]}
                {...rotatePanResponder.panHandlers}
              >
                <MaterialIcons name="rotate-right" size={16} color="#fff" />
              </View>

              <View
                style={pageStyles.shapeResizeHandle}
                {...resizePanResponder.panHandlers}
                pointerEvents="auto"
              >
                <View style={pageStyles.stickerRotateHandleInner} />
              </View>
            </>
          )}
        </>
      )}
    </Animated.View>
  );
}