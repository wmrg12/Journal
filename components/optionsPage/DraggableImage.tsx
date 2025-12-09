import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  PanResponder,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
   ActivityIndicator,
   Text,
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
  isDownloading?: boolean; 
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
  isDownloading = false,
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
  const [size, setSize] = useState({
    width: image.width ?? 120,
    height: image.height ?? 120,
  });
  const [rotation, setRotation] = useState(image.rotation ?? 0);
  const rotationRef = useRef(rotation);

  // keep last computed size in a ref so release/save uses the exact last values
  const lastSizeRef = useRef({ width: size.width, height: size.height });

  //state & refs
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: image.x, y: image.y });
  const resizeStart = useRef({
    w: size.width,
    h: size.height,
    startX: 0,
    startY: 0,
  });
  const rotateStart = useRef({
    centerX: 0,
    centerY: 0,
    startAngle: 0,
    startRotation: 0,
  });
  const boxRef = useRef<View | null>(null);

  const isResizingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isRotatingRef = useRef(false);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // sync local state when incoming image props change
  useEffect(() => {
    if (
      isResizingRef.current ||
      isDraggingRef.current ||
      isRotatingRef.current
    ) {
      return;
    }
    setSize({ width: image.width ?? 120, height: image.height ?? 120 });
  }, [image.width, image.height]);

  useEffect(() => {
    if (
      isResizingRef.current ||
      isDraggingRef.current ||
      isRotatingRef.current
    ) {
      return;
    }
    setRotation(image.rotation ?? 0);
    rotationRef.current = image.rotation ?? 0;
  }, [image.rotation]);

  // sync lastSizeRef whenever size state or incoming props change
  useEffect(() => {
    lastSizeRef.current = { width: size.width, height: size.height };
  }, [size.width, size.height]);

  useEffect(() => {
    if (isResizingRef.current) return;
    lastSizeRef.current = {
      width: image.width ?? 120,
      height: image.height ?? 120,
    };
  }, [image.width, image.height]);

  useEffect(() => {
    Animated.timing(pan, {
      toValue: { x: image.x, y: image.y },
      duration: 0,
      useNativeDriver: false,
    }).start();
  }, [image.x, image.y, pan]);

  const measureBox = (
    cb?: (x: number, y: number, w: number, h: number) => void
  ) => {
    if (!boxRef.current) return;
    boxRef.current.measureInWindow(
      (x: number, y: number, w: number, h: number) => {
        if (cb) cb(x, y, w, h);
      }
    );
  };

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

        // SIN LÍMITES: no aplicamos recortes al mover, permiten coordenadas negativas o fuera del canvas
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

        // SIN LÍMITES: guardamos la posición tal cual
        pan.setValue({ x: newX, y: newY });

        try {
          onMoveEnd(image.id, newX, newY);
        } catch (e) {
          console.error("onMoveEnd error:", e);
        }

        try {
          await updatePageImage(image.id, {
            position_x: newX,
            position_y: newY,
          });
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

  // resizeResponder: actualiza setSize y lastSizeRef, y al soltar persiste desde el ref
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDownloading, // 
      onMoveShouldSetPanResponder: () => !isDownloading, // 
      onPanResponderGrant: (evt) => {
        toolbarButtonPressed.current = true;
        isResizingRef.current = true;
        resizeStart.current = {
          w: lastSizeRef.current.width,
          h: lastSizeRef.current.height,
          startX: (evt as any).nativeEvent.pageX,
          startY: (evt as any).nativeEvent.pageY,
        };
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

        // SIN LÍMITES: ya no recortamos por canvasWidth/canvasHeight
        setSize({ width: nextW, height: nextH });
        lastSizeRef.current = { width: nextW, height: nextH };
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        isResizingRef.current = false;

        const finalW = Math.max(
          MIN_SIZE,
          Math.round(lastSizeRef.current.width)
        );
        const finalH = Math.max(
          MIN_SIZE,
          Math.round(lastSizeRef.current.height)
        );

        setSize({ width: finalW, height: finalH });

        try {
          onResizeEnd(image.id, finalW, finalH);
        } catch (e) {
          console.error("onResizeEnd error:", e);
        }

        try {
          await updatePageImage(image.id, { width: finalW, height: finalH });
        } catch (e) {
          console.error("Error guardando tamaño de la imagen en BD:", e);
        }
      },
      onPanResponderTerminate: async () => {
        toolbarButtonPressed.current = false;
        isResizingRef.current = false;
        const finalW = Math.max(
          MIN_SIZE,
          Math.round(lastSizeRef.current.width)
        );
        const finalH = Math.max(
          MIN_SIZE,
          Math.round(lastSizeRef.current.height)
        );

        setSize({ width: finalW, height: finalH });

        try {
          onResizeEnd(image.id, finalW, finalH);
        } catch (e) {
          console.error("onResizeEnd error (terminate):", e);
        }

        try {
          await updatePageImage(image.id, { width: finalW, height: finalH });
        } catch (e) {
          console.error("Error guardando tamaño (terminate):", e);
        }
      },
    })
  ).current;

  /* --- Rotate panResponder (guarda en BD al soltar) --- */
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDownloading, // 
      onMoveShouldSetPanResponder: () => !isDownloading, // 
      onPanResponderGrant: (evt) => {
        toolbarButtonPressed.current = true;
        onSelect(image.id);

        measureBox((x, y, w, h) => {
          rotateStart.current.centerX = x + w / 2;
          rotateStart.current.centerY = y + h / 2;

          const { pageX, pageY } = (evt as any).nativeEvent;
          rotateStart.current.startAngle =
            Math.atan2(
              pageY - rotateStart.current.centerY,
              pageX - rotateStart.current.centerX
            ) *
            (180 / Math.PI);
          rotateStart.current.startRotation = rotationRef.current ?? rotation;
        });
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = (evt as any).nativeEvent;
        const currentAngle =
          Math.atan2(
            pageY - rotateStart.current.centerY,
            pageX - rotateStart.current.centerX
          ) *
          (180 / Math.PI);
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
          const toSave = Number((rotationRef.current ?? rotation) || 0);
          await updatePageImage(image.id, { rotation: toSave });
        } catch (e) {
          console.error("Error guardando rotación de la imagen en BD:", e);
        }
      },
      onPanResponderTerminate: async () => {
        toolbarButtonPressed.current = false;
        onRotateEnd(image.id, rotationRef.current ?? rotation);
        try {
          const toSave = Number((rotationRef.current ?? rotation) || 0);
          await updatePageImage(image.id, { rotation: toSave });
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

  const handleTap = () => {
    if (toolbarButtonPressed.current || isDownloading) return; // 
    onSelect(image.id);
  };

  const handleLayout = (_e: LayoutChangeEvent) => {
    measureBox();
  };

   return (
    <Animated.View
      {...(isDownloading ? {} : panResponder.panHandlers)} // 🔥 Deshabilitar pan si está descargando
      style={[
        {
          position: "absolute",
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
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
        <View
          style={{
            width: "100%",
            height: "100%",
            transform: [{ rotate: `${rotation}deg` }],
          }}
        >
          {/* 🔥 MOSTRAR PLACEHOLDER SI ESTÁ DESCARGANDO */}
          {isDownloading ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "#3b82f6",
                borderStyle: "dashed",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#3b82f6",
                  fontWeight: "600",
                }}
              >
                Descargando...
              </Text>
            </View>
          ) : (
            // Renderizar imagen normal solo si NO está descargando
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
          )}
        </View>

        {/* 🔥 OCULTAR CONTROLES SI ESTÁ DESCARGANDO */}
        {isSelected && !isDownloading && (
          <>
            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleDelete}
              style={[S.shapeControlButton, S.shapeDeleteButton]}
            >
              <Feather name="trash-2" size={14} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleEdit}
              style={[
                S.shapeControlButton,
                {
                  top: -20,
                  right: -20,
                  position: "absolute",
                  backgroundColor: uiColors.primary,
                },
              ]}
            >
              <Feather name="edit-2" size={14} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPressIn={() => (toolbarButtonPressed.current = true)}
              onPress={handleDuplicate}
              style={[S.shapeControlButton, S.shapeDuplicateButton]}
            >
              <Feather name="copy" size={14} color="#fff" />
            </TouchableOpacity>

            <View
              {...rotatePanResponder.panHandlers}
              style={[S.shapeControlButton, S.shapeRotateButton]}
              pointerEvents="box-only"
            >
              <Feather name="rotate-cw" size={14} color="#fff" />
            </View>

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