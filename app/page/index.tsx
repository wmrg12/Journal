import { useMemo } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { pagePalette } from "@/constants/colors";
import S from "../../styles/pageViewStyles";
import { upsertJournal, upsertPage } from "@/src/db/repo";

type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

export default function PageView() {
  const { journalId, color, pageNumber, totalPages } =
    useLocalSearchParams<Params>();
  const router = useRouter();

  function handleDeletePage() {
    if (total <= 1) {
      Alert.alert("No se puede eliminar", "Debe existir al menos una página.");
      return;
    }
    Alert.alert(
      "Eliminar página",
      "¿Estás seguro de que deseas eliminar esta página? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            const newTotal = total - 1;
            const target = Math.max(pageNum - 1, 1);
            router.replace({
              pathname: "/page",
              params: {
                journalId,
                color: String(color ?? bg),
                pageNumber: String(target),
                totalPages: String(newTotal),
              },
            });
          },
        },
      ]
    );
  }

   async function handleSave() {
    try {
      const id = String(journalId ?? "debug-journal");
      const name = `Diario ${id}`; // si ya tienes el nombre real, úsalo
      const bgColor = String(color ?? bg);
      const pageId = `${id}-${pageNum}`;

      await upsertJournal({ id, name, color: bgColor });
      await upsertPage({
        id: pageId,
        journal_id: id,
        page_number: pageNum,
        bg_color: bgColor,
      });
      router.replace("/tabs/home");
    } catch (e: any) {
      console.warn(e);
      Alert.alert("No se pudo guardar", "Intenta nuevamente.");
    }
  }

  function handleAddPage() {
    const target = pageNum + 1;
    const newTotal = total + 1;
    router.push({
      pathname: "/page",
      params: {
        journalId,
        color: String(color ?? bg),
        pageNumber: String(target),
        totalPages: String(newTotal),
      },
    });
  }

  const bg = useMemo(() => {
    if (!color || typeof color !== "string") return pagePalette[0];
    const found = (pagePalette as readonly string[]).find(
      (c) => c.toLowerCase() === color.toLowerCase()
    );
    return (found ?? pagePalette[0]) as (typeof pagePalette)[number];
  }, [color]);

  const pageNum = Math.max(Number(pageNumber ?? 1) || 1, 1);
  const total = Math.max(Number(totalPages ?? 1) || 1, 1);

  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: bg }]}
      edges={["top", "left", "right"]}
    >
      {/* header */}
      <View style={S.header}>
        {/* IZQUIERDA: ← → */}
        <View style={S.leftGroup}>
          {pageNum > 1 && (
            <TouchableOpacity
              onPress={() =>
                router.replace({
                  pathname: "/page",
                  params: {
                    journalId,
                    color: String(color ?? bg),
                    pageNumber: String(pageNum - 1),
                    totalPages: String(total),
                  },
                })
              }
            >
              <Text style={S.backIcon as any}>←</Text>
            </TouchableOpacity>
          )}
          {pageNum < total && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/page",
                  params: {
                    journalId,
                    color: String(color ?? bg),
                    pageNumber: String(pageNum + 1),
                    totalPages: String(total),
                  },
                })
              }
              style={{ marginLeft: 12 }}
            >
              <Text style={S.nextIcon as any}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={S.titleWrap} pointerEvents="none">
          <Text style={S.title}>{`pag ${pageNum}`}</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={S.checkButton}
          accessibilityLabel="Hecho"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={S.checkIcon as any}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* lienzo */}
      <View style={S.canvas} />

      {/* toolbar */}
      <View style={S.toolbar}>
        {/* 1) subir img,audio, etc */}
        <TouchableOpacity style={S.toolCircle} onPress={() => {}}>
          <Text style={S.toolIcon as any}>...</Text>
        </TouchableOpacity>

        {/* 2) eliminar pag actual */}
        <TouchableOpacity style={S.toolCircle} onPress={handleDeletePage}>
          <Text style={S.toolIcon as any}>x</Text>
        </TouchableOpacity>

        {/* 3) añadir pag */}
        <TouchableOpacity style={S.toolCircle} onPress={handleAddPage}>
          <Text style={S.toolIcon as any}>+</Text>
        </TouchableOpacity>

        {/* 4) dibujar */}
        <TouchableOpacity style={S.toolCircle} onPress={() => {}}>
          <Text style={S.toolIcon as any}>✎</Text>
        </TouchableOpacity>

        {/* 5) undo */}
        <TouchableOpacity style={S.toolCircle} onPress={() => {}}>
          <Text style={S.toolIcon as any}>↩</Text>
        </TouchableOpacity>

        {/* 6) redo */}
        <TouchableOpacity style={S.toolCircle} onPress={() => {}}>
          <Text style={S.toolIcon as any}>↪</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
