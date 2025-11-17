import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  PanResponder,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import S from "@/styles/pageViewStyles";
import { uiColors } from "@/constants/colors";
import { updatePageImage } from "@/src/db/dao";

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
  const pan = useRef(new Animated.ValueXY({ x: image.x, y: image.y })).current;

  // size / rotation
  const [size, setSize] = useState({ width: image.width ?? 120, height: image.height ?? 120 });
  const [rotation, setRotation] = useState(image.rotation ?? 0);
  const rotationRef = useRef(rotation);

  //state & refs
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: image.x, y: image.y });
  const resizeStart = useRef({ w: size.width, h: size.height, startX: 0, startY: 0 });
  const rotateStart = useRef({ centerX: 0, centerY: 0, startAngle: 0, startRotation: 0 });
  const boxRef = useRef<View | null>(null);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => setSize({ width: image.width ?? 120, height: image.height ?? 120 }), [image.width, image.height]);
  useEffect(() => {
    setRotation(image.rotation ?? 0);
    rotationRef.current = image.rotation ?? 0;
  }, [image.rotation]);

  
  useEffect(() => {
    Animated.timing(pan, {
      toValue: { x: image.x, y: image.y },
      duration: 0,
      useNativeDriver: false,
    }).start();
  }, [image.x, image.y, pan]);

  const measureBox = (cb?: (x: number, y: number, w: number, h: number) => void) => {
    if (!boxRef.current) return;
  
    boxRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
      if (cb) cb(x, y, w, h);
    });
  };

  // VALIDACIÓN: asegura que la imagen esté dentro del canvas al montar
  const hasValidatedPosition = useRef(false);
  useEffect(() => {
    if (!hasValidatedPosition.current && canvasWidth > 0 && canvasHeight > 0 && size.width > 0 && size.height > 0) {
      const currentX = (pan.x as any)._value;
      const currentY = (pan.y as any)._value;
      let validX = Math.max(0, Math.min(currentX, canvasWidth - size.width));
      let validY = Math.max(0, Math.min(currentY, canvasHeight - size.height));
      if (validX !== currentX || validY !== currentY) {
        pan.setValue({ x: validX, y: validY });
      
        (async () => {
          try {
            await updatePageImage(image.id, { position_x: validX, position_y: validY });
          } catch (e) {
            console.error("Error guardando posición inicial de la imagen:", e);
          }
        })();
        onMoveEnd(image.id, validX, validY);
      }
      hasValidatedPosition.current = true;
    }
  }, [canvasWidth, canvasHeight, size.width, size.height]);

  /* ---------- Move panResponder (guarda en BD al soltar) ---------- */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, g) => {
        if (toolbarButtonPressed.current) return false;
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
        onSelect(image.id);
      },
      onPanResponderMove: (_, g) => {
        let nx = startRef.current.x + g.dx;
        let ny = startRef.current.y + g.dy;

        // aplicar límites del canvas
        if (canvasWidth > 0) {
          nx = Math.max(0, Math.min(nx, canvasWidth - size.width));
        }
        if (canvasHeight > 0) {
          ny = Math.max(0, Math.min(ny, canvasHeight - size.height));
        }

        pan.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: async (_evt, g) => {
        if (toolbarButtonPressed.current) {
          toolbarButtonPressed.current = false;
          setIsDragging(false);
          return;
        }

        setIsDragging(false);
        const newX = startRef.current.x + g.dx;
        const newY = startRef.current.y + g.dy;

        // asegurar dentro canvas final
        let finalX = newX;
        let finalY = newY;
        if (canvasWidth > 0) finalX = Math.max(0, Math.min(finalX, canvasWidth - size.width));
        if (canvasHeight > 0) finalY = Math.max(0, Math.min(finalY, canvasHeight - size.height));

        pan.setValue({ x: finalX, y: finalY });

        
        try {
          onMoveEnd(image.id, finalX, finalY);
        } catch (e) {
          console.error("onMoveEnd error:", e);
        }

        try {
          await updatePageImage(image.id, { position_x: finalX, position_y: finalY });
        } catch (e) {
          console.error("Error guardando posición de la imagen en BD:", e);
        }
      },
      onPanResponderTerminate: () => {
        toolbarButtonPressed.current = false;
        setIsDragging(false);
      },
    })
  ).current;

  
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

       
        const currentX = (pan.x as any)._value ?? image.x;
        const currentY = (pan.y as any)._value ?? image.y;
        if (canvasWidth > 0 && currentX + nextW > canvasWidth) nextW = Math.max(MIN_SIZE, canvasWidth - currentX);
        if (canvasHeight > 0 && currentY + nextH > canvasHeight) nextH = Math.max(MIN_SIZE, canvasHeight - currentY);

        setSize({ width: nextW, height: nextH });
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        onResizeEnd(image.id, size.width, size.height);

        try {
          await updatePageImage(image.id, { width: size.width, height: size.height });
        } catch (e) {
          console.error("Error guardando tamaño de la imagen en BD:", e);
        }
      },
      onPanResponderTerminate: async () => {
        toolbarButtonPressed.current = false;
        onResizeEnd(image.id, size.width, size.height);
        try {
          await updatePageImage(image.id, { width: size.width, height: size.height });
        } catch (e) {
          console.error("Error guardando tamaño (terminate):", e);
        }
      },
    })
  ).current;

  /* --- Rotate panResponder (guarda en BD al soltar) --- */
  const rotatePanResponder = useRef(
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
          rotateStart.current.startRotation = rotationRef.current ?? rotation;
        });
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = (evt as any).nativeEvent;
        const currentAngle = Math.atan2(pageY - rotateStart.current.centerY, pageX - rotateStart.current.centerX) * (180 / Math.PI);
        const delta = currentAngle - rotateStart.current.startAngle;
        const newRot = rotateStart.current.startRotation + delta;
        setRotation(newRot);
        rotationRef.current = newRot;
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        onRotateEnd(image.id, rotationRef.current ?? rotation);

        // Persistir en BD
        try {
          await updatePageImage(image.id, { rotation: rotationRef.current ?? rotation });
        } catch (e) {
          console.error("Error guardando rotación de la imagen en BD:", e);
        }
      },
      onPanResponderTerminate: async () => {
        toolbarButtonPressed.current = false;
        onRotateEnd(image.id, rotationRef.current ?? rotation);
        try {
          await updatePageImage(image.id, { rotation: rotationRef.current ?? rotation });
        } catch (e) {
          console.error("Error guardando rotación (terminate):", e);
        }
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

  // tap selection
  const handleTap = () => {
    if (toolbarButtonPressed.current) return;
    onSelect(image.id);
  };

  const handleLayout = (_e: LayoutChangeEvent) => {
    measureBox();
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
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
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={{ width: "100%", height: "100%" }}>
          <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="cover" />
        </TouchableOpacity>

        {isSelected && (
          <>
            {/* delete - top-left */}
            <TouchableOpacity onPressIn={() => (toolbarButtonPressed.current = true)} onPress={handleDelete} style={[S.shapeControlButton, S.shapeDeleteButton]}>
              <Feather name="trash-2" size={14} color="#fff" />
            </TouchableOpacity>

            {/* edit - top-right */}
            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleEdit}
              style={[S.shapeControlButton, { top: -20, right: -20, position: "absolute", backgroundColor: uiColors.primary }]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
            </TouchableOpacity>

            {/* duplicate - bottom-left */}
            <TouchableOpacity onPressIn={() => (toolbarButtonPressed.current = true)} onPress={handleDuplicate} style={[S.shapeControlButton, S.shapeDuplicateButton]}>
              <Feather name="copy" size={14} color="#fff" />
            </TouchableOpacity>

            {/* rotate - bottom-right */}
            <View {...rotatePanResponder.panHandlers} style={[S.shapeControlButton, S.shapeRotateButton]} pointerEvents="box-only">
              <Feather name="rotate-cw" size={14} color="#fff" />
            </View>

            {/* resize - bottom-center */}
            <View {...resizeResponder.panHandlers} style={[S.shapeResizeHandle, { bottom: -24 }]} pointerEvents="box-only">
              <View style={S.shapeResizeHandleInner} />
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default DraggableImage;