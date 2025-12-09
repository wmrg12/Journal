import { uiColors } from "@/constants/colors";
import S from "@/styles/pageViewStyles";
import { Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  Image as SvgImage,
} from "react-native-svg";
import ViewShot from "react-native-view-shot";

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

  const [showCropOptions, setShowCropOptions] = useState(false);
  const [shape, setShape] = useState<Shape>("none");

  const viewShotRef = useRef<any>(null);

  // Obtener dimensiones originales
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

  // Reemplazar imagen
  const pickReplace = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // Paths de figuras
  const HEART_PATH =
    "M50 88 L17 55 C2 40 10 15 35 15 C50 15 50 30 50 30 C50 30 50 15 65 15 C90 15 98 40 83 55 Z";
  const STAR_PATH =
    "M50 5 L61 39 L98 39 L67 59 L78 93 L50 72 L22 93 L33 59 L2 39 L39 39 Z";

  // Guardar imagen
  const handleSave = async () => {
    if (!image || !workingUri) {
      setIsProcessing(false);
      onClose();
      return;
    }
    try {
      // Si no hay recorte, devolver tal cual
      if (!showCropOptions || shape === "none") {
        onSave(image.id, workingUri, {
          rotation,
          width: naturalSize?.w,
          height: naturalSize?.h,
        });

        return;
      }

      // Si hay recorte con ViewShot
      if (!viewShotRef.current) {
        Alert.alert("Error", "No se pudo capturar la imagen.");
        return;
      }

      const uri = await viewShotRef.current.capture();
      if (!uri) {
        Alert.alert("Error", "No se pudo generar la imagen recortada.");
        return;
      }

      const box = 260;
      onSave(image.id, uri, { rotation, width: box, height: box });
    } catch (e) {
      console.error("save capture error", e);
      Alert.alert("Error", "No se pudo guardar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const PreviewMasked = ({ size = 300 }: { size?: number }) => {
    const box = size;
    return (
      <ViewShot
        ref={viewShotRef}
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
                    transform={`scale(${box / 100})`}
                  />
                )}
                {shape === "star" && (
                  <Path
                    d={STAR_PATH}
                    transform={`scale(${box / 100})`}
                  />
                )}
              </ClipPath>
            )}
          </Defs>

          {workingUri && shape !== "none" && (
            <G clipPath="url(#mask)">
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
      <View style={[S.backdrop, { backgroundColor: "transparent" }]}>
        <View style={S.sheet}>
          <View style={S.previewWrap}>
            {workingUri ? (
              <PreviewMasked size={260} />
            ) : (
              <View style={S.placeholder}>
                <Text>No hay imagen</Text>
              </View>
            )}
          </View>

          <View style={S.actionsRow}>
            <TouchableOpacity onPress={pickReplace} style={S.actionBtn}>
              <Feather name="image" size={18} color={uiColors.black} />
              <Text style={S.actionLabel}>Reemplazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowCropOptions((s) => !s);
                if (showCropOptions) setShape("none");
                else setShape("square");
              }}
              style={[S.actionBtn, showCropOptions && S.actionBtnActive]}
            >
              <Feather name="crop" size={18} color={uiColors.black} />
              <Text style={S.actionLabel}>Recortar</Text>
            </TouchableOpacity>
          </View>

          {showCropOptions && (
            <View style={S.cropOptionsRow}>
              <TouchableOpacity
                style={[S.cropButton, shape === "square" && S.actionBtnActive]}
                onPress={() => setShape("square")}
              >
                <Text style={S.cropButtonText}>Cuadrado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.cropButton, shape === "circle" && S.actionBtnActive]}
                onPress={() => setShape("circle")}
              >
                <Text style={S.cropButtonText}>Círculo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.cropButton, shape === "heart" && S.actionBtnActive]}
                onPress={() => setShape("heart")}
              >
                <Text style={S.cropButtonText}>Corazón</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.cropButton, shape === "star" && S.actionBtnActive]}
                onPress={() => setShape("star")}
              >
                <Text style={S.cropButtonText}>Estrella</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[S.cropButton, shape === "none" && S.actionBtnActive]}
                onPress={() => setShape("none")}
              >
                <Text style={S.cropButtonText}>Full</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={S.footerRow}>
            <TouchableOpacity onPress={onClose} style={S.cancelBtn}>
              <Text style={S.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} style={S.saveBtn}>
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={S.saveText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
