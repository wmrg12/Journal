// components/optionsPage/EditImageModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { uiColors } from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import Svg, {
  Defs,
  ClipPath,
  Rect,
  Circle,
  Path,
  G,
  Image as SvgImage,
} from "react-native-svg";

type Props = {
  visible: boolean;
  image: {
    id: string;
    uri: string;
    width?: number;
    height?: number;
    rotation?: number;
  } | null;
  onClose: () => void;
  onSave: (
    id: string,
    newUri: string,
    opts?: { rotation?: number; width?: number; height?: number }
  ) => void;
};

type Shape = "none" | "square" | "circle" | "heart" | "star";

export default function EditImageModal({
  visible,
  image,
  onClose,
  onSave,
}: Props) {
  const [workingUri, setWorkingUri] = useState<string | null>(
    image?.uri ?? null
  );
  const [rotation, setRotation] = useState<number>(image?.rotation ?? 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  // showCropOptions controla si se muestran las formas (solo aparece al pulsar el botón Recortar)
  const [showCropOptions, setShowCropOptions] = useState(false);
  const [shape, setShape] = useState<Shape>("none");

  // ViewShot ref (any para evitar TS en versiones donde capture() no toma args)
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    setWorkingUri(image?.uri ?? null);
    setRotation(image?.rotation ?? 0);
    setNaturalSize(null);
    setShowCropOptions(false);
    setShape("none");
    if (image?.uri) {
      Image.getSize(
        image.uri,
        (w, h) => setNaturalSize({ w, h }),
        (err) => {
          console.warn("Image.getSize error:", err);
          setNaturalSize(null);
        }
      );
    }
  }, [image]);

  const doRotate = async (deg = 90) => {
    try {
      if (!workingUri) return;
      setIsProcessing(true);
      const res = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ rotate: deg }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );
      setWorkingUri(res.uri);
      setRotation((r) => r + deg);
      Image.getSize(
        res.uri,
        (w, h) => setNaturalSize({ w, h }),
        () => {}
      );
    } catch (e) {
      console.error("rotate error", e);
      Alert.alert("Error", "No se pudo rotar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const pickReplace = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        setWorkingUri(result.assets[0].uri);
        setRotation(0);
        Image.getSize(
          result.assets[0].uri,
          (w, h) => setNaturalSize({ w, h }),
          () => {}
        );
      }
    } catch (e) {
      console.error("pickReplace error", e);
    }
  };

  // Paths normalizados 0..100 para heart y star
  const HEART_PATH =
    "M50 88 L17 55 C2 40 10 15 35 15 C50 15 50 30 50 30 C50 30 50 15 65 15 C90 15 98 40 83 55 Z";
  const STAR_PATH =
    "M50 5 L61 39 L98 39 L67 59 L78 93 L50 72 L22 93 L33 59 L2 39 L39 39 Z";

  // Guarda: si no hay forma, devolvemos la uri actual; si hay forma, capturamos el ViewShot
  const handleSave = async () => {
    if (!image || !workingUri) return onClose();
    try {
      setIsProcessing(true);

      if (!showCropOptions || shape === "none") {
        // sin recorte: devolver la uri original (posiblemente una imagen rotada si se rotó)
        onSave(image.id, workingUri, { rotation });
        setIsProcessing(false);
        return;
      }

      // Comprobación del ref y captura (sin args, que es la versión que tu view-shot acepta)
      if (!viewShotRef.current) {
        Alert.alert(
          "Error",
          "No se pudo capturar la imagen (referencia no encontrada)."
        );
        setIsProcessing(false);
        return;
      }

      const uri: string | null = await viewShotRef.current.capture();

      if (!uri) {
        Alert.alert("Error", "No se pudo generar la imagen recortada.");
        setIsProcessing(false);
        return;
      }

      // Resultado: png con transparencia en fondo fuera de la forma
      onSave(image.id, uri, { rotation });
    } catch (e) {
      console.error("save capture error", e);
      Alert.alert("Error", "No se pudo guardar la imagen recortada.");
    } finally {
      setIsProcessing(false);
    }
  };

  const PreviewMasked = ({ size = 300 }: { size?: number }) => {
    const box = size;
    return (
      // Establecemos backgroundColor transparent para que la captura tenga transparencia
      <ViewShot
        ref={viewShotRef}
        // opciones en el componente (capture() usará estas opciones si tu versión de view-shot no acepta args)
        options={{
          format: "png",
          quality: 1,
          result: "tmpfile",
        }}
        style={{
          width: box,
          height: box,
          backgroundColor: "transparent",
          alignSelf: "center",
        }}
      >
        <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
          <Defs>
            {shape !== "none" && (
              <ClipPath id="mask">
                {shape === "square" && (
                  <Rect x="0" y="0" width={box} height={box} />
                )}
                {shape === "circle" && (
                  <Circle cx={box / 2} cy={box / 2} r={box / 2} />
                )}
                {shape === "heart" && (
                  <Path
                    d={HEART_PATH}
                    transform={`scale(${box / 100}) translate(0,0)`}
                  />
                )}
                {shape === "star" && (
                  <Path
                    d={STAR_PATH}
                    transform={`scale(${box / 100}) translate(0,0)`}
                  />
                )}
              </ClipPath>
            )}
          </Defs>

          {/* Fondo transparente (no fill) */}
          <Rect x="0" y="0" width={box} height={box} fill="transparent" />

          {/* Imagen raster dentro del grupo clipPath -> esto garantiza que la imagen sea recortada */}
          {workingUri && shape !== "none" && (
            <G clipPath="url(#mask)">
              {/* SvgImage con preserveAspectRatio='xMidYMid slice' hace 'cover' del box */}
              <SvgImage
                x={0}
                y={0}
                width={box}
                height={box}
                preserveAspectRatio="xMidYMid slice"
                href={{ uri: workingUri }}
              />
            </G>
          )}

          {/* si no hay forma seleccionada mostramos la imagen entera centrada (fit inside) */}
          {workingUri && shape === "none" && (
            <SvgImage
              x={0}
              y={0}
              width={box}
              height={box}
              preserveAspectRatio="xMidYMid meet"
              href={{ uri: workingUri }}
            />
          )}
        </Svg>
      </ViewShot>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.previewWrap}>
            {workingUri ? (
              <PreviewMasked size={260} />
            ) : (
              <View style={styles.placeholder}>
                <Text>No hay imagen</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => doRotate(90)}
              style={styles.actionBtn}
            >
              <Feather name="rotate-ccw" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Rotar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickReplace} style={styles.actionBtn}>
              <Feather name="image" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Reemplazar</Text>
            </TouchableOpacity>

            {/* al pulsar togglea showCropOptions: solo entonces aparecen las formas */}
            <TouchableOpacity
              onPress={() => {
                setShowCropOptions((s) => !s);
                // si se cierra el panel, resetear la forma a 'none' para evitar recorte accidental
                if (showCropOptions) setShape("none");
                else setShape("square"); // al abrir por defecto seleccionar cuadrado
              }}
              style={[
                styles.actionBtn,
                showCropOptions && styles.actionBtnActive,
              ]}
            >
              <Feather name="crop" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Recortar</Text>
            </TouchableOpacity>
          </View>

          {/* Solo se muestran las opciones de forma cuando showCropOptions === true */}
          {showCropOptions && (
            <View style={styles.cropOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.cropButton,
                  shape === "square" && styles.actionBtnActive,
                ]}
                onPress={() => setShape("square")}
              >
                <Text style={styles.cropButtonText}>Cuadrado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cropButton,
                  shape === "circle" && styles.actionBtnActive,
                ]}
                onPress={() => setShape("circle")}
              >
                <Text style={styles.cropButtonText}>Círculo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cropButton,
                  shape === "heart" && styles.actionBtnActive,
                ]}
                onPress={() => setShape("heart")}
              >
                <Text style={styles.cropButtonText}>Corazón</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cropButton,
                  shape === "star" && styles.actionBtnActive,
                ]}
                onPress={() => setShape("star")}
              >
                <Text style={styles.cropButtonText}>Estrella</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cropButton,
                  shape === "none" && styles.actionBtnActive,
                ]}
                onPress={() => setShape("none")}
              >
                <Text style={styles.cropButtonText}>Full</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 14,
    minHeight: 420,
  },
  previewWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  previewImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  placeholder: {
    width: 260,
    height: 260,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  actionBtn: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionBtnActive: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    marginTop: 6,
    color: uiColors.black,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  cancelText: {
    color: "#333",
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: uiColors.primary,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
  cropOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    flexWrap: "wrap",
  },
  cropButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  cropButtonText: {
    fontWeight: "600",
    color: "#222",
  },
});
