import { useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { pagePalette } from "@/constants/colors";
import S from "../../styles/pageViewStyles";
import { createPage, deletePage, getTotalPages, getPageColor } from "@/src/db/dao";

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

  const [bg, setBg] = useState<(typeof pagePalette)[number]>(pagePalette[0]);

  // inicializa desde el param `color` si viene
  useEffect(() => {
    if (typeof color === "string") {
      const found = (pagePalette as readonly string[]).find(
        (c) => c.toLowerCase() === color.toLowerCase()
      );
      setBg((found ?? pagePalette[0]) as (typeof pagePalette)[number]);
    } else {
      setBg(pagePalette[0]);
    }
  }, [color]);

  // consulta el color guardado en BD para esta página y lo aplica
  const pageNum = Math.max(Number(pageNumber ?? 1) || 1, 1);
  useEffect(() => {
    if (!journalId) return;
    (async () => {
      const dbColor = await getPageColor(String(journalId), pageNum);
      if (typeof dbColor === "string" && dbColor.length > 0) {
        const found = (pagePalette as readonly string[]).find(
          (c) => c.toLowerCase() === dbColor.toLowerCase()
        );
        if (found) setBg(found as (typeof pagePalette)[number]);
      }
    })().catch(console.error);
  }, [journalId, pageNum]);

  const total = Math.max(Number(totalPages ?? 1) || 1, 1);
  const totalParam = Math.max(total, 1);

  // al cargar, sincroniza el total con lo que hay en BD
  useEffect(() => {
    if (!journalId) return;
    (async () => {
      const dbTotal = await getTotalPages(String(journalId));
      const safeTotal = Math.max(dbTotal, 1);
      if (safeTotal !== totalParam || pageNum > safeTotal) {
        router.replace({
          pathname: "/page",
          params: {
            journalId,
            color: String(bg),
            pageNumber: String(Math.min(pageNum, safeTotal)),
            totalPages: String(safeTotal),
          },
        });
      }
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  // acciones
  const handleDeletePage = () => {
    if (totalParam <= 1 || !journalId) {
      Alert.alert("No se puede eliminar", "Debe existir al menos una página.");
      return;
    }
    Alert.alert("Eliminar página", `¿Eliminar la página ${pageNum}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const { pageNumber: target, total: newTotal } = await deletePage(
              String(journalId),
              pageNum
            );
            router.replace({
              pathname: "/page",
              params: {
                journalId,
                color: String(bg),
                pageNumber: String(target),
                totalPages: String(newTotal),
              },
            });
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo eliminar la página.");
          }
        },
      },
    ]);
  };

  const handleAddPage = async () => {
    if (!journalId) return;
    try {
      // crea heredando el color actual de la hoja
      const { pageNumber: newNum, total: newTotal } = await createPage(
        String(journalId),
        String(bg)
      );
      router.replace({
        pathname: "/page",
        params: {
          journalId,
          color: String(bg),
          pageNumber: String(newNum),
          totalPages: String(newTotal),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear la página.");
    }
  };

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
                    color: String(bg),
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
                    color: String(bg),
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
          onPress={() => {
            router.replace({
              pathname: "/tabs/home",
              params: { journalId, color: String(bg) },
            });
          }}
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
