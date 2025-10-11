import { uiColors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import HeaderDiarios from "../../components/headerDiary";
import styles from "@/styles/globalStyles";
import { useCallback, useState } from "react";
import { listJournals, Journal, getTotalPages } from "@/src/db/dao";

export default function Home() {
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [items, setItems] = useState<Journal[]>([]);
  const [hl, setHl] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<"mine" | "fav">("mine");

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

  const filtered = tab === "fav" ? items.filter((i) => i.is_favorite === 1) : items;

  const openJournal = async (j: Journal) => {
    const total = Math.max(await getTotalPages(j.id), 1);
    router.push({
      pathname: "/page",
      params: {
        journalId: j.id,
        color: j.color,
        pageNumber: "1",
        totalPages: String(total),
      },
    });
  };

  const renderItem = ({ item }: { item: Journal }) => {
    const isHL = !!hl && item.id === hl;
    return (
      <TouchableOpacity
        onPress={() => openJournal(item)}
        style={[styles.card, isHL && styles.cardHL, { backgroundColor: item.color }]}
      >
        <Text numberOfLines={1} style={styles.cardTitle}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const Empty = () => (
    <View style={styles.content}>
      <Ionicons name="book-outline" size={80} color={uiColors.brown} />
      <Text style={styles.message}>
        {tab === "fav" ? "Aún no tienes favoritos" : "CREA UN DIARIO..!"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderDiarios
        active={tab}
        onChangeTab={(t) => setTab(t)}
        onPressSearch={() => {
        }}
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
