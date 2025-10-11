import { pagePalette, uiColors } from "@/constants/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View, TouchableOpacity, Alert } from "react-native";
import S from "../styles/createPageStyles";
import ColorPalette from "@/components/ColorPalette";
import { createPage } from "@/src/db/dao";

type Params = { journalId?: string; color?: string; name?: string };

export default function CreatePageScreen() {
  const router = useRouter();
  const { journalId, color } = useLocalSearchParams<Params>();
  const [bgColor, setBgColor] = useState<(typeof pagePalette)[number]>(pagePalette[0]);

  useEffect(() => {
    if (typeof color === "string") {
      const found = (pagePalette as readonly string[]).find(
        (c) => c.toLowerCase() === color.toLowerCase()
      );
      if (found) setBgColor(found as (typeof pagePalette)[number]);
    }
  }, [color]);

  if (!journalId || typeof journalId !== "string") {
    // defensa
    return (
      <View style={[S.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Falta journalId. Vuelve a “Crear Diario”.</Text>
      </View>
    );
  }

  async function handleCreatePage() {
    try {
      const { pageNumber, total } = await createPage(journalId as string, bgColor);
      router.push({
        pathname: "/page",
        params: {
          journalId,
          color: bgColor,
          pageNumber: String(pageNumber),
          totalPages: String(total),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear la página.");
    }
  }

  return (
    <View style={S.container} testID="create-page-screen">
      {/* Header */}
      <Text style={S.title} accessibilityRole="header" testID="header-title">
        Crear Página
      </Text>

      {/* Preview */}
      <Text style={S.label} testID="preview-label">
        Vista Previa
      </Text>
      <View
        style={[S.preview, { backgroundColor: bgColor }]}
        testID="preview"
        accessibilityLabel="Vista previa de la página"
      >
        <Image
          source={require("../../assets/images/notebook-open.png")}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
            opacity:
              bgColor.toLowerCase() === uiColors.white.toLowerCase() ? 1 : 0.95,
          }}
        />
      </View>

      {/* Color Picker */}
      <View style={S.colorSection}>
        <Text style={S.colorLabel}>Color:</Text>
        <ColorPalette
          options={pagePalette}
          value={bgColor}
          onChange={(color) => {
            const found = (pagePalette as readonly string[]).find(
              (c) => c.toLowerCase() === color.toLowerCase()
            );
            if (found) setBgColor(found as (typeof pagePalette)[number]);
          }}
        />
      </View>

      {/* Create */}
      <TouchableOpacity style={S.createButton} onPress={handleCreatePage}>
        <Text style={S.createButtonText}>Crear</Text>
      </TouchableOpacity>
    </View>
  );
}
