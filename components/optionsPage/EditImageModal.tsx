// components/optionsPage/EditImageModal.tsx
import React, { useEffect, useState } from "react";
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

/**
 * Props:
 *  visible: boolean
 *  image: { id, uri, width?, height?, rotation? } | null
 *  onClose: () => void
 *  onSave: (id, newUri, opts?) => void
 */
type Props = {
  visible: boolean;
  image: { id: string; uri: string; width?: number; height?: number; rotation?: number } | null;
  onClose: () => void;
  onSave: (id: string, newUri: string, opts?: { rotation?: number; width?: number; height?: number }) => void;
};

export default function EditImageModal({ visible, image, onClose, onSave }: Props) {
  const [workingUri, setWorkingUri] = useState<string | null>(image?.uri ?? null);
  const [rotation, setRotation] = useState<number>(image?.rotation ?? 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [showCropOptions, setShowCropOptions] = useState(false);

  useEffect(() => {
    setWorkingUri(image?.uri ?? null);
    setRotation(image?.rotation ?? 0);
    setNaturalSize(null);
    setShowCropOptions(false);
    if (image?.uri) {
      // obtener tamaño natural de la imagen
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

  // ROTAR 90 grados (manipulateAsync crea una nueva URI)
  const doRotate = async (deg = 90) => {
    try {
      if (!workingUri) return;
      setIsProcessing(true);
      const res = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ rotate: deg }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      setWorkingUri(res.uri);
      setRotation((r) => r + deg);
      // actualizar tamaño natural después de rotar
      Image.getSize(res.uri, (w, h) => setNaturalSize({ w, h }), () => {});
    } catch (e) {
      console.error("rotate error", e);
      Alert.alert("Error", "No se pudo rotar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  // REEMPLAZAR imagen con galería
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
        // actualizar natural size del nuevo asset
        Image.getSize(result.assets[0].uri, (w, h) => setNaturalSize({ w, h }), () => {});
      }
    } catch (e) {
      console.error("pickReplace error", e);
    }
  };

  // Guardar - llama al onSave del padre
  const handleSave = async () => {
    if (!image || !workingUri) return onClose();
    onSave(image.id, workingUri, { rotation });
  };

  // Recortar: calcula recorte centrado basado en relación (ratio = w/h)
  const doCropCentered = async (ratioW: number, ratioH: number) => {
    if (!workingUri) return;
    try {
      setIsProcessing(true);

      // si no tenemos tamaño natural, intentar obtenerlo
      let w = naturalSize?.w;
      let h = naturalSize?.h;
      if (!w || !h) {
        await new Promise<void>((resolve) => {
          Image.getSize(
            workingUri,
            (ww, hh) => {
              w = ww;
              h = hh;
              setNaturalSize({ w: ww, h: hh });
              resolve();
            },
            () => resolve()
          );
        });
      }
      if (!w || !h) {
        Alert.alert("Error", "No se pudo determinar el tamaño de la imagen para recortar.");
        setIsProcessing(false);
        return;
      }

      // tamaño objetivo manteniendo ratio dentro de la imagen original (max centered box)
      const targetRatio = ratioW / ratioH;
      const currentRatio = w / h;

      let cropW = w;
      let cropH = h;

      if (currentRatio > targetRatio) {
        // imagen más ancha: limitar ancho
        cropH = h;
        cropW = Math.round(h * targetRatio);
      } else {
        // imagen más alta: limitar alto
        cropW = w;
        cropH = Math.round(w / targetRatio);
      }

      const originX = Math.round((w - cropW) / 2);
      const originY = Math.round((h - cropH) / 2);

      const manipResult = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      setWorkingUri(manipResult.uri);
      // update natural size to new one
      setNaturalSize({ w: cropW, h: cropH });
      setShowCropOptions(false);
    } catch (e) {
      console.error("crop error", e);
      Alert.alert("Error", "No se pudo recortar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  // UI: botones rápidos para ratio
  const CropOptions = () => (
    <View style={styles.cropOptionsRow}>
      <TouchableOpacity style={styles.cropButton} onPress={() => doCropCentered(1, 1)}>
        <Text style={styles.cropButtonText}>1:1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cropButton} onPress={() => doCropCentered(4, 3)}>
        <Text style={styles.cropButtonText}>4:3</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cropButton} onPress={() => doCropCentered(16, 9)}>
        <Text style={styles.cropButtonText}>16:9</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cropButton}
        onPress={() => {
          // Full: no crop / cancel crop options
          setShowCropOptions(false);
        }}
      >
        <Text style={styles.cropButtonText}>Full</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.previewWrap}>
            {workingUri ? (
              <Image source={{ uri: workingUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Text>No hay imagen</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => doRotate(90)} style={styles.actionBtn}>
              <Feather name="rotate-ccw" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Rotar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickReplace} style={styles.actionBtn}>
              <Feather name="image" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Reemplazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCropOptions((s) => !s)}
              style={[styles.actionBtn, showCropOptions && styles.actionBtnActive]}
            >
              <Feather name="crop" size={18} color={uiColors.black} />
              <Text style={styles.actionLabel}>Recortar</Text>
            </TouchableOpacity>
          </View>

          {showCropOptions && <CropOptions />}

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Guardar</Text>}
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
    minHeight: 360,
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
    width: 240,
    height: 240,
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
  },
  cropButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  cropButtonText: {
    fontWeight: "600",
    color: "#222",
  },
});
