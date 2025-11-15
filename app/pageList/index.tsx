import { uiColors } from "@/constants/colors";
import {
  createPage,
  getPageColor,
  getPageId,
  getTotalPages,
  listPageDraws,
  listPageShapes,
  listPageTexts,
} from "@/src/db/dao";
import styles from "@/styles/globalStyles";
import S from "@/styles/pageListStyles";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { BackHandler, FlatList, Keyboard, Text, TouchableOpacity, View } from "react-native";

type PageItem = {
  number: number;
  color: string;
  hasText: boolean;
  hasDraw: boolean;
  hasShapes: boolean;
};

export default function PagesList() {
  const { journalId, journalName, journalColor } = useLocalSearchParams<{
    journalId: string;
    journalName: string;
    journalColor: string;
  }>();

  const [pages, setPages] = useState<PageItem[]>([]);

  const loadPages = useCallback(async () => {
    if (!journalId) return;
    const total = await getTotalPages(String(journalId));
    const list: PageItem[] = [];

    for (let i = 1; i <= total; i++) {
      const color =
        (await getPageColor(String(journalId), i)) ??
        (journalColor as string);

      // Consultar contenido de la página
      const pageId = await getPageId(String(journalId), i);

      let hasText = false;
      let hasDraw = false;
      let hasShapes = false;

      if (pageId) {
        const [texts, draws, shapes] = await Promise.all([
          listPageTexts(pageId),
          listPageDraws(pageId),
          listPageShapes(pageId),
        ]);

        hasText = texts.length > 0;
        hasDraw = draws.length > 0;
        hasShapes = shapes.length > 0;
      }

      list.push({ number: i, color, hasText, hasDraw, hasShapes });
    }

    setPages(list);
  }, [journalId, journalColor]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useFocusEffect(
    useCallback(() => {
      // Ocultar el teclado al enfocar la pantalla para evitar desplazamientos
      Keyboard.dismiss();
      loadPages();
    }, [loadPages])
  );

  const openPage = (pageNumber: number, color: string) => {
    router.push({
      pathname: "/page",
      params: {
        journalId,
        color,
        pageNumber: String(pageNumber),
        totalPages: String(pages.length),
        journalName,
        journalColor,
      },
    });
  };

  const handleCreatePage = async () => {
    if (!journalId) return;
    const { pageNumber: newNum, total: newTotal } = await createPage(
      String(journalId),
      String(journalColor)
    );

    await loadPages();

    router.push({
      pathname: "/page",
      params: {
        journalId,
        color: String(journalColor),
        pageNumber: String(newNum),
        totalPages: String(newTotal),
        journalName,
        journalColor,
      },
    });
  };

  const renderPage = ({ item }: { item: PageItem }) => (
    <View style={S.item}>
      <TouchableOpacity
        style={S.card}
        onPress={() => openPage(item.number, item.color)}
        activeOpacity={0.85}
      >
        {/* Pagina vertical */}
        <View style={S.pagePreviewWrap}>
          <View
            style={[S.pagePreviewPortrait, { backgroundColor: item.color }]}
          >
            {/* Badge con número de página */}
            <View style={S.pageNumberBadge}>
              <Text style={S.pageNumberText}>{item.number}</Text>
            </View>
            {/* Iconos de contenido en la mini página */}
            <View style={{ position: "absolute", bottom: 4, right: 4, flexDirection: "row", gap: 4 }}>
              {item.hasText && (
                <Ionicons name="text-outline" size={12} color={uiColors.white} />
              )}
              {item.hasDraw && (
                <Ionicons name="brush-outline" size={12} color={uiColors.white} />
              )}
              {item.hasShapes && (
                <Ionicons name="shapes-outline" size={12} color={uiColors.white} />
              )}
            </View>
          </View>
        </View>

        <View style={S.footerChip}>
          <Text style={S.footerText}>Página {item.number}</Text>
          <View style={S.footerIcon}>
            <Ionicons name="happy-outline" size={16} color={uiColors.brown} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Capturar el botón back del dispositivo para ir a tabs/home
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/tabs/home');
      return true; // true = manejamos el evento
    });

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => {
            router.replace("/tabs/home");
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="arrow-back" size={28} color={uiColors.danger} />
                <Text style={[styles.message, { marginLeft: 18 }]}>Mis paginas</Text>
          </View>
        </TouchableOpacity>
        <Text style={S.headerTitle}>{journalName}</Text>
      </View>

      <FlatList
        data={pages}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderPage}
        numColumns={2}
        columnWrapperStyle={S.columns}
        contentContainerStyle={S.list}
        ListEmptyComponent={
          <View style={styles.content}>
            <Ionicons name="book-outline" size={80} color={uiColors.brown} />
          </View>
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />

      <TouchableOpacity style={S.fab} onPress={handleCreatePage}>
        <Ionicons name="add" size={28} color={uiColors.white} />
      </TouchableOpacity>
    </View>
  );
}
