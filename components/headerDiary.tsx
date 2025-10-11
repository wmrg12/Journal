import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, TouchableOpacity, View } from "react-native";
import styles from "@/styles/globalStyles"; // ruta correcta desde /components
import { uiColors } from "../constants/colors";

export type TabKey = "mine" | "fav";

type Props = {
  /** Tab activo controlado desde el padre */
  active?: TabKey;
  /** Notifica al padre cuando cambia la pestaña */
  onChangeTab?: (tab: TabKey) => void;
  /** Acción del botón de búsqueda */
  onPressSearch?: () => void;
};

export default function HeaderDiarios({
  active: activeProp = "mine",
  onChangeTab,
  onPressSearch,
}: Props) {
  // 0 = mine, 1 = fav
  const [activeIdx, setActiveIdx] = useState<number>(activeProp === "fav" ? 1 : 0);
  const [containerW, setContainerW] = useState(280);
  const translateX = useRef(new Animated.Value(activeIdx)).current;

  useEffect(() => {
    const idx = activeProp === "fav" ? 1 : 0;
    setActiveIdx(idx);
    Animated.spring(translateX, { toValue: idx, useNativeDriver: true }).start();
  }, [activeProp]);

  const lateralPadding = 4;
  const indicatorW = (containerW - lateralPadding) / 2;

  const onTab = (i: number) => {
    setActiveIdx(i);
    Animated.spring(translateX, { toValue: i, useNativeDriver: true }).start();
    onChangeTab?.(i === 0 ? "mine" : "fav");
  };

  return (
    <View style={styles.tabsWrapper}>
      <View
        style={styles.tabsContainer}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorW,
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, indicatorW],
                  }),
                },
              ],
            },
          ]}
        />

        <Pressable style={styles.tab} onPress={() => onTab(0)}>
          <Text style={[styles.tabText, activeIdx === 0 && styles.activeTabText]}>
            Mis Diarios
          </Text>
        </Pressable>

        <Pressable style={styles.tab} onPress={() => onTab(1)}>
          <Text style={[styles.tabText, activeIdx === 1 && styles.activeTabText]}>
            Favoritos
          </Text>
        </Pressable>
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={onPressSearch}>
        <Ionicons name="search" size={22} color={uiColors.danger} />
      </TouchableOpacity>
    </View>
  );
}
