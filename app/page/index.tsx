import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { pagePalette } from "@/constants/colors";
import S from "../../styles/pageViewStyles";

type Params = { journalId?: string; color?: string; pageNumber?: string };

export default function PageView() {
  const { color, pageNumber } = useLocalSearchParams<Params>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const bg = useMemo(() => {
    if (!color || typeof color !== "string") return pagePalette[0];
    const found = (pagePalette as readonly string[]).find(
      (c) => c.toLowerCase() === color.toLowerCase()
    );
    return (found ?? pagePalette[0]) as (typeof pagePalette)[number];
  }, [color]);

  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* header */}
      <View
        style={[
          S.header,
          {
            paddingTop: 4,
            height: 44 + insets.top, // asegura espacio bajo la barra
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[S.backButton, { top: insets.top + 4 }]} // flecha bajo el notch
          accessibilityLabel="Volver"
        >
          <Text style={S.backIcon as any}>←</Text>
        </TouchableOpacity>

        <Text style={S.title}>{`pag ${pageNumber ?? "1"}`}</Text>
      </View>

      {/* lienzo */}
      <View style={S.canvas} />

      {/* menu */}
      <TouchableOpacity style={S.fab} accessibilityLabel="Abrir menú">
        <Text style={S.fabIcon as any}>≡</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
