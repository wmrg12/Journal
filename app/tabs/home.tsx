import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import HeaderDiarios from "@/components/headerDiary";
import { uiColors } from "@/constants/colors";
// ⬇️ Asegúrate que el import viene del archivo donde tengas el repo
import { listJournals } from "@/src/db/repo"; // o "../../src/db/repo"

type J = { id: string; name: string; color: string; is_favorite: number; created_at: number };
type TabKey = "mine" | "fav";

export default function Home() {
  const [items, setItems] = useState<J[]>([]);
  const [tab, setTab] = useState<TabKey>("mine");
  const journalId = "debug-journal";

  const load = useCallback(() => {
    listJournals().then(setItems).catch(console.warn);
  }, []);
  useFocusEffect(load);

  const data = useMemo(
    () => (tab === "fav" ? items.filter((i) => i.is_favorite === 1) : items),
    [items, tab]
  );

  return (
    <View style={styles.container}>
      {/* Header controla las pestañas y notifica al Home */}
      <HeaderDiarios
        active={tab}
        onChangeTab={(t) => setTab(t)}
        onPressSearch={() => {
          // TODO: navega a una pantalla de búsqueda o abre modal
          console.log("Buscar...");
        }}
      />

      {data.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={80} color={uiColors.brown} />
          <Text style={styles.msg}>
            {tab === "fav" ? "Aún no tienes favoritos" : "CREA UN DIARIO..!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          columnWrapperStyle={{ gap: 16 }}
          renderItem={({ item }) => <DiaryCard item={item} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push({
            pathname: "/createDiary",
            params: { journalId },
          })
        }
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function DiaryCard({ item }: { item: J }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={[card.cover, { backgroundColor: item.color }]}>
        <Ionicons
          name={item.is_favorite ? "heart" : "heart-outline"}
          size={18}
          color={item.is_favorite ? "#C62828" : "#C88"}
          style={card.heart}
        />
        <View style={card.dotMenu}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>…</Text>
        </View>
        <Text style={card.title}>{item.name}</Text>
        <View style={card.ribbon} />
      </View>
      <Text style={card.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );
}

/* ===== Estilos ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8EFE6" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  msg: { marginTop: 12, fontSize: 16, color: "#7B6A61" },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#C14B39",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});

const card = StyleSheet.create({
  cover: {
    height: 170,
    borderRadius: 16,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  heart: { position: "absolute", left: 10, top: 10 },
  dotMenu: {
    position: "absolute",
    left: 10,
    bottom: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, color: "rgba(0,0,0,0.45)" },
  ribbon: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 12,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  date: { marginTop: 8, color: "#8A7A73", fontSize: 12 },
});
