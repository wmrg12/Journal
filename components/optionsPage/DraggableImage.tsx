// components/optionsPage/DraggableImage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  PanResponder,
  TouchableOpacity,
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import S from "@/styles/pageViewStyles";
import { uiColors } from "@/constants/colors";

type Img = {
  id: string;
  uri: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
};

type Props = {
  image: Img;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveEnd: (id: string, x: number, y: number) => void;
  onResizeEnd: (id: string, width: number, height: number) => void;
  onRotateEnd: (id: string, rotationDeg: number) => void;
  canvasWidth?: number;
  canvasHeight?: number;
  onDuplicate?: (id: string) => void;
};

const MIN_SIZE = 40;

export const DraggableImage: React.FC<Props> = ({
  image,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMoveEnd,
  onResizeEnd,
  onRotateEnd,
  canvasWidth = 0,
  canvasHeight = 0,
  onDuplicate,
}) => {
  // Animated pan for smooth movement (translateX/Y)
  const pan = useRef(new Animated.ValueXY({ x: image.x, y: image.y })).current;
  const [size, setSize] = useState({ width: image.width ?? 120, height: image.height ?? 120 });
  const [rotation, setRotation] = useState(image.rotation ?? 0);
  const [isDragging, setIsDragging] = useState(false);

  // refs para gestos y flags
  const dragStart = useRef({ x: image.x, y: image.y });
  const resizeStart = useRef({ w: size.width, h: size.height, startX: 0, startY: 0 });
  const rotateStart = useRef({ centerX: 0, centerY: 0, startAngle: 0, startRotation: 0 });
  const toolbarButtonPressed = useRef(false);

  // ref para medir caja en pantalla
  const boxRef = useRef<View | null>(null);
  const measured = useRef({ x: 0, y: 0, w: size.width, h: size.height });

  // sincronizar cuando props cambian
  useEffect(() => {
    Animated.timing(pan, {
      toValue: { x: image.x, y: image.y },
      duration: 0,
      useNativeDriver: false,
    }).start();
  }, [image.x, image.y, pan]);

  useEffect(() => setSize({ width: image.width ?? 120, height: image.height ?? 120 }), [image.width, image.height]);
  useEffect(() => setRotation(image.rotation ?? 0), [image.rotation]);

  // helper measureInWindow
  const measureBox = (cb?: (x: number, y: number, w: number, h: number) => void) => {
    if (!boxRef.current) return;
    // @ts-ignore
    boxRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
      measured.current = { x, y, w, h };
      if (cb) cb(x, y, w, h);
    });
  };

  /* ---------- Drag panResponder (mover) ---------- */
  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, g) => {
        // evitar si tocamos un botón del toolbar
        if (toolbarButtonPressed.current) return false;
        if (g.numberActiveTouches !== 1) return false;
        return Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3;
      },
      onPanResponderGrant: () => {
        // empezar drag
        const vx = (pan.x as any)._value ?? image.x;
        const vy = (pan.y as any)._value ?? image.y;
        dragStart.current = { x: vx, y: vy };
        setIsDragging(true);
        onSelect(image.id);
      },
      onPanResponderMove: (_, g) => {
        let nx = dragStart.current.x + g.dx;
        let ny = dragStart.current.y + g.dy;

        // límites canvas
        if (canvasWidth > 0) nx = Math.max(0, Math.min(nx, canvasWidth - size.width));
        if (canvasHeight > 0) ny = Math.max(0, Math.min(ny, canvasHeight - size.height));

        pan.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: (_evt, g) => {
        setIsDragging(false);
        if (toolbarButtonPressed.current) {
          toolbarButtonPressed.current = false;
          return;
        }

        const newX = dragStart.current.x + g.dx;
        const newY = dragStart.current.y + g.dy;

        pan.setValue({ x: newX, y: newY });
        onMoveEnd(image.id, newX, newY);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        toolbarButtonPressed.current = false;
      },
    })
  ).current;

  /* ---------- Resize panResponder (bottom-center handle) ---------- */
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        toolbarButtonPressed.current = true;
        resizeStart.current = { w: size.width, h: size.height, startX: (evt as any).nativeEvent.pageX, startY: (evt as any).nativeEvent.pageY };
        onSelect(image.id);
        measureBox();
      },
      onPanResponderMove: (evt) => {
        const pageX = (evt as any).nativeEvent.pageX;
        const pageY = (evt as any).nativeEvent.pageY;
        const dx = pageX - resizeStart.current.startX;
        const dy = pageY - resizeStart.current.startY;

        let nextW = Math.max(MIN_SIZE, resizeStart.current.w + dx);
        let nextH = Math.max(MIN_SIZE, resizeStart.current.h + dy);

        // limitar por canvas
        const currentX = (pan.x as any)._value ?? image.x;
        const currentY = (pan.y as any)._value ?? image.y;
        if (canvasWidth > 0 && currentX + nextW > canvasWidth) nextW = Math.max(MIN_SIZE, canvasWidth - currentX);
        if (canvasHeight > 0 && currentY + nextH > canvasHeight) nextH = Math.max(MIN_SIZE, canvasHeight - currentY);

        setSize({ width: nextW, height: nextH });
      },
      onPanResponderRelease: () => {
        toolbarButtonPressed.current = false;
        onResizeEnd(image.id, size.width, size.height);
      },
      onPanResponderTerminate: () => {
        toolbarButtonPressed.current = false;
        onResizeEnd(image.id, size.width, size.height);
      },
    })
  ).current;

  /* ---------- Rotate panResponder (bottom-right) ---------- */
  const rotateResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        toolbarButtonPressed.current = true;
        onSelect(image.id);
        measureBox((x, y, w, h) => {
          rotateStart.current.centerX = x + w / 2;
          rotateStart.current.centerY = y + h / 2;
          const { pageX, pageY } = (evt as any).nativeEvent;
          rotateStart.current.startAngle = Math.atan2(pageY - rotateStart.current.centerY, pageX - rotateStart.current.centerX) * (180 / Math.PI);
          rotateStart.current.startRotation = rotation;
        });
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = (evt as any).nativeEvent;
        const currentAngle = Math.atan2(pageY - rotateStart.current.centerY, pageX - rotateStart.current.centerX) * (180 / Math.PI);
        const delta = currentAngle - rotateStart.current.startAngle;
        const newRot = rotateStart.current.startRotation + delta;
        setRotation(newRot);
      },
      onPanResponderRelease: () => {
        toolbarButtonPressed.current = false;
        onRotateEnd(image.id, rotation);
      },
      onPanResponderTerminate: () => {
        toolbarButtonPressed.current = false;
        onRotateEnd(image.id, rotation);
      },
    })
  ).current;

  // BUTTON HANDLERS
  const handleDelete = () => {
    toolbarButtonPressed.current = true;
    onDelete(image.id);
    toolbarButtonPressed.current = false;
  };
  const handleEdit = () => {
    toolbarButtonPressed.current = true;
    onEdit(image.id);
    toolbarButtonPressed.current = false;
  };
  const handleDuplicate = () => {
    toolbarButtonPressed.current = true;
    if (onDuplicate) onDuplicate(image.id);
    toolbarButtonPressed.current = false;
  };

  // tap selection (touch without moving) - overlay button so touch registers
  const handleTap = () => {
    if (toolbarButtonPressed.current) return;
    onSelect(image.id);
  };

  // keep measured layout updated when size changes
  const handleLayout = (_e: LayoutChangeEvent) => {
    measureBox();
  };

  // Render usando Animated View y translate transforms
  return (
    <Animated.View
      {...dragResponder.panHandlers}
      style={[
        {
          position: "absolute",
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: `${rotation}deg` },
          ],
          width: size.width,
          height: size.height,
          zIndex: isSelected ? 1000 : 1,
          overflow: "visible",
        },
      ]}
    >
      <View
        ref={boxRef}
        onLayout={handleLayout}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleTap}
          style={{ width: "100%", height: "100%" }}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Controls (igual estilo que DraggableText / shapes) */}
        {isSelected && (
          <>
            {/* eliminar: top-left */}
            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleDelete}
              style={[S.shapeControlButton, S.shapeDeleteButton]}
            >
              <Feather name="trash-2" size={14} color="#fff" />
            </TouchableOpacity>

            {/* editar: top-right (usa misma estética que los puntitos) */}
            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleEdit}
              style={[
                S.shapeControlButton,
                { top: -20, right: -20, position: "absolute", backgroundColor: uiColors.primary },
              ]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
            </TouchableOpacity>

            {/* duplicar: bottom-left */}
            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleDuplicate}
              style={[S.shapeControlButton, S.shapeDuplicateButton]}
            >
              <Feather name="copy" size={14} color="#fff" />
            </TouchableOpacity>

            {/* rotar: bottom-right */}
            <View {...rotateResponder.panHandlers} style={[S.shapeControlButton, S.shapeRotateButton]} pointerEvents="box-only">
              <Feather name="rotate-cw" size={14} color="#fff" />
            </View>

            {/* resize: bottom-center */}
            <View
              {...resizeResponder.panHandlers}
              style={[S.shapeResizeHandle, { bottom: -24 }]}
              pointerEvents="box-only"
            >
              <View style={S.shapeResizeHandleInner} />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default DraggableImage;
