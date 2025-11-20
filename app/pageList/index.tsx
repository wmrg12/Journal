import { uiColors } from "@/constants/colors";
import {
  createPage,
  getPageColor,
  getPageId,
  getTotalPages,
  listPageDraws,
  listPageShapes,
  listPageTexts,
  listPageImages,
  listPageStickers,
} from "@/src/db/dao";
import styles from "@/styles/globalStyles";
import S from "@/styles/pageListStyles";
import SmallPagePreview from "@/components/pageList/SmallPagePreview";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  FlatList,
  Keyboard,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PageItem = {
  number: number;
  color: string;
  hasText: boolean;
  hasDraw: boolean;
  hasShapes: boolean;
  texts?: any[];
  draws?: any[];
  shapes?: any[];
  images?: any[];
  stickers?: any[];
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
        (await getPageColor(String(journalId), i)) ?? (journalColor as string);

      // Consultar contenido de la página
      const pageId = await getPageId(String(journalId), i);

      let hasText = false;
      let hasDraw = false;
      let hasShapes = false;
      let texts: any[] = [];
      let draws: any[] = [];
      let shapes: any[] = [];
      let images: any[] = [];
      let stickers: any[] = [];

      if (pageId) {
        const [texts, draws, shapes, images, stickers] = await Promise.all([
          listPageTexts(pageId),
          listPageDraws(pageId),
          listPageShapes(pageId),
          listPageImages(pageId),
          listPageStickers(pageId),
        ]);
        hasText = texts.length > 0;
        hasDraw = draws.length > 0;
        hasShapes = shapes.length > 0;

        list.push({
          number: i,
          color,
          hasText,
          hasDraw,
          hasShapes,
          texts,
          draws,
          shapes,
          images,
          stickers,
        });
      }
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
        <View style={S.pagePreviewWrap}>
          <SmallPagePreview
            bgColor={item.color}
            texts={item.texts}
            draws={item.draws}
            shapes={item.shapes}
            images={item.images}
            stickers={item.stickers}
            sourceWidth={555}
            sourceHeight={850}
            extraScale={1.05}
            alignVertical="center"
            centerNullPositions={true}
            style={{ width: "100%", height: "100%" }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              flexDirection: "row",
              gap: 6,
            }}
          >
            {item.hasText && (
              <Ionicons name="text-outline" size={12} color={uiColors.white} />
            )}
            {item.hasDraw && (
              <Ionicons name="brush-outline" size={12} color={uiColors.white} />
            )}
            {item.hasShapes && (
              <Ionicons
                name="shapes-outline"
                size={12}
                color={uiColors.white}
              />
            )}
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
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.replace("/tabs/home");
        return true;
      }
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.replace("/tabs/home")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="arrow-back" size={28} color={uiColors.danger} />
            <Text style={[styles.message, { marginLeft: 18 }]}>
              Mis paginas
            </Text>
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
