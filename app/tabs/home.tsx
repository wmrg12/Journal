import { uiColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import HeaderDiarios from "../../components/headerDiary";
import styles from "@/styles/globalStyles";
import { useCallback, useState, useMemo } from "react";
import { listJournals, Journal, getTotalPages, getPageColor, toggleFavorite } from "@/src/db/dao";

export default function Home() {
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [items, setItems] = useState<Journal[]>([]);
  const [hl, setHl] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<"mine" | "fav">("mine");
  const [range, setRange] = useState<{ from?: number; to?: number }>({});
  
  const load = useCallback(async () => {
    const rows = await listJournals();
    setItems(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (typeof highlight === "string" && highlight.length > 0) {
        setHl(highlight);
        const t = setTimeout(() => setHl(undefined), 2500);
        return () => clearTimeout(t);
      }
    }, [load, highlight])
  );
  
  const byTab = useMemo(
    () => (tab === "fav" ? items.filter(i => i.is_favorite === 1) : items),
    [items, tab]
  );

  const filtered = useMemo(() => {
    if (!range.from || !range.to) return byTab;
    return byTab.filter((d: Journal) => d.created_at >= range.from! && d.created_at < range.to!);
  }, [byTab, range]);

  const openJournal = async (j: Journal) => {
    const total = Math.max(await getTotalPages(j.id), 1);
    const c1 = (await getPageColor(j.id, 1)) ?? j.color;

    router.push({
      pathname: "/pageList",
      params: { 
        journalId: j.id,
        totalPages: total.toString(),
        color: c1,
      }
    });
  };

  const onToggleFavorite = async (j: Journal) => {
    const next = j.is_favorite === 1 ? 0 : 1;

    setItems(prev => prev.map(it => (it.id === j.id ? { ...it, is_favorite: next } : it)));

    try {
      await toggleFavorite(j.id, next === 1);
    } catch (e) {
      console.error("toggleFavorite error:", e);
      setItems(prev => prev.map(it => (it.id === j.id ? { ...it, is_favorite: j.is_favorite } : it)));
    }
  };

  const renderItem = ({ item }: { item: Journal }) => {
    const isHL = !!hl && item.id === hl;
    const isFav = item.is_favorite === 1;
    const fecha = new Date(item.created_at * 1000).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          onPress={() => openJournal(item)}
          style={[styles.card, isHL && styles.cardHL, { backgroundColor: item.color }]}
          activeOpacity={0.9}
        >
          <View style={styles.bookBinding} />
          <View style={styles.bookDivider} />
          
          {/* Boton favorito */}
          <View style={styles.favWrap}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                onToggleFavorite(item);
              }}
              activeOpacity={0.85}
              style={[styles.favBtn, isFav && styles.favBtnActive]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={20}
                color={isFav ? (uiColors.danger ?? "#E63946") : uiColors.white}
              />
            </TouchableOpacity>
          </View>
          
          {/* Boton editar */}
          <View style={styles.editWrap}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                router.push({
                  pathname: "/editCover",
                  params: { journalId: item.id },
                });
              }}
              activeOpacity={0.85}
              style={styles.editBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={uiColors.gray} />
            </TouchableOpacity>
          </View>

          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.name}
          </Text>
        </TouchableOpacity>

        {/* Fecha  */}
        <Text style={styles.cardDate}>{fecha}</Text>
      </View>
    );
  };

  const Empty = () => (
    <View style={styles.content}>
      <Ionicons name="book-outline" size={80} color={uiColors.brown} />
      <Text style={styles.message}>
        {tab === "fav" ? "Aun no tienes favoritos" : "CREA UN DIARIO..!"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderDiarios
        active={tab}
        onChangeTab={(t) => setTab(t)}
        onApplyDates={setRange}
      />

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={
          filtered.length ? styles.gridContent : styles.emptyContent
        }
        ListEmptyComponent={<Empty />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: "/createDiary" })}
      >
        <Ionicons name="add" size={28} color={uiColors.white} />
      </TouchableOpacity>
    </View>
  );
}