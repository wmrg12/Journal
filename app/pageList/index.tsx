import SmallPagePreview from "@/components/pageList/SmallPagePreview";
import { uiColors } from "@/constants/colors";
import {
  createPage,
  getPageColor,
  getPageId,
  getPagePattern,
  getTotalPages,
  listPageAudios,
  listPageDraws,
  listPageImages,
  listPageShapes,
  listPageStickers,
  listPageTexts,
} from "@/src/db/dao";
import styles from "@/styles/globalStyles";
import S from "@/styles/pageListStyles";
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
  pattern: string;
  hasText: boolean;
  hasDraw: boolean;
  hasShapes: boolean;
  hasImages: boolean;
  hasStickers: boolean;
  hasAudio: boolean;
  texts?: any[];
  draws?: any[];
  shapes?: any[];
  images?: any[];
  stickers?: any[];
  audios?: any[];
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

      const pattern = (await getPagePattern(String(journalId), i)) ?? "none";
      const pageId = await getPageId(String(journalId), i);

      let texts: any[] = [];
      let draws: any[] = [];
      let shapes: any[] = [];
      let images: any[] = [];
      let stickers: any[] = [];
      let audios: any[] = [];

      if (pageId) {
        const results = await Promise.all([
          listPageTexts(pageId),
          listPageDraws(pageId),
          listPageShapes(pageId),
          listPageImages(pageId),
          typeof listPageStickers === "function"
            ? listPageStickers(pageId)
            : Promise.resolve([]),
          typeof listPageAudios === "function"
            ? listPageAudios(pageId)
            : Promise.resolve([]),
        ]);

        texts = results[0] ?? [];
        draws = results[1] ?? [];
        shapes = results[2] ?? [];
        images = results[3] ?? [];
        stickers = results[4] ?? [];
        audios = results[5] ?? [];

        // Filtrar draws: si un trazo tiene segmentos (son hijos), no mostrar el padre
        const segments = new Set<string>();
        const parentIds = new Set<string>();
        for (const draw of draws) {
          const match = draw.id.match(/^(.+?)_seg_\d+_\d+$/);
          if (match) {
            segments.add(draw.id);
            parentIds.add(match[1]); // ID del padre
          }
        }
        draws = draws.filter((d) => {
          // Si es segmento, mantener
          if (segments.has(d.id)) return true;
          // Si es padre de segmentos, filtrar
          if (parentIds.has(d.id)) return false;
          // Si no es ni segmento ni padre, mantener
          return true;
        });
      }

      list.push({
        number: i,
        color,
        pattern,
        hasText: texts.length > 0,
        hasDraw: draws.length > 0,
        hasShapes: shapes.length > 0,
        hasImages: images.length > 0,
        hasStickers: stickers.length > 0,
        hasAudio: audios.length > 0,
        texts,
        draws,
        shapes,
        images,
        stickers,
        audios,
      });
    }

    setPages(list);
  }, [journalId, journalColor]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  useFocusEffect(
    useCallback(() => {
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
        activeOpacity={0.9}
      >
        <View style={S.pagePreviewWrap}>
          <View style={S.pagePreviewPortrait}>
            <SmallPagePreview
              bgColor={item.color}
              pattern={item.pattern}
              texts={item.texts}
              draws={item.draws}
              shapes={item.shapes}
              images={item.images}
              stickers={item.stickers}
              audios={item.audios}
              sourceWidth={400}
              sourceHeight={800}
              originalCanvasWidth={330}
              originalCanvasHeight={650}
              positionMode="topleft"
              debug={false}
              style={{ width: "100%", height: "100%" }}
            />
          </View>

          <View style={S.contentIndicators}>
            {item.hasText && (
              <Ionicons name="text-outline" size={14} color={uiColors.black} />
            )}
            {item.hasDraw && (
              <Ionicons name="brush-outline" size={14} color={uiColors.black} />
            )}
            {item.hasShapes && (
              <Ionicons name="shapes-outline" size={14} color={uiColors.black} />
            )}
            {item.hasImages && (
              <Ionicons name="image-outline" size={14} color={uiColors.black} />
            )}
            {item.hasStickers && (
              <Ionicons name="happy-outline" size={14} color={uiColors.black} />
            )}
            {item.hasAudio && (
              <Ionicons name="musical-notes-outline" size={14} color={uiColors.black} />
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