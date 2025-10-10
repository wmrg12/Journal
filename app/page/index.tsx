import { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { pagePalette } from "@/constants/colors";
import S from "../../styles/pageViewStyles";

type Params = { journalId?: string; color?: string; pageNumber?: string };

export default function PageView() {
  const { journalId, color, pageNumber } = useLocalSearchParams<Params>();
  const router = useRouter();

  const bg = useMemo(() => {
    if (!color || typeof color !== "string") return pagePalette[0];
    const found = (pagePalette as readonly string[]).find(
      (c) => c.toLowerCase() === color.toLowerCase()
    );
    return (found ?? pagePalette[0]) as (typeof pagePalette)[number];
  }, [color]);

  const pageNum = Number(pageNumber ?? 1) || 1;

  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* header */}
      <View
        style={[
          S.header,
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={S.backButton}
          accessibilityLabel="Volver"
        >
          <Text style={S.backIcon as any}>←</Text>
        </TouchableOpacity>

        <Text style={S.title}>{`pag ${pageNum}`}</Text>

      <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/page',
              params: {
                journalId,
                color: String(color ?? bg),
                pageNumber: String(pageNum + 1),
              },
            })
          }
          style={S.rightButton}
          accessibilityLabel="Siguiente página"
        >
          <Text style={S.nextIcon as any}>→</Text>
        </TouchableOpacity>
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
