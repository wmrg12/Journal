import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import styles from "@/styles/globalStyles"; // ruta correcta desde /components
import { uiColors } from "../constants/colors";

export type TabKey = "mine" | "fav";

type Props = {
  /** Tab activo controlado desde el padre */
  active?: TabKey;
  /** Notifica al padre cuando cambia la pestaña */
  onChangeTab?: (tab: TabKey) => void;
  //accion del boton de fecha
  onApplyDates?: (range: { from?: number; to?: number }) => void;
};

export default function HeaderDiarios({
  active: activeProp = "mine",
  onChangeTab,
  onApplyDates,
}: Props) {
  // 0 = mine, 1 = fav
  const [activeIdx, setActiveIdx] = useState<number>(
    activeProp === "fav" ? 1 : 0
  );
  const [containerW, setContainerW] = useState(280);
  const translateX = useRef(new Animated.Value(activeIdx)).current;

  useEffect(() => {
    const idx = activeProp === "fav" ? 1 : 0;
    setActiveIdx(idx);
    Animated.spring(translateX, {
      toValue: idx,
      useNativeDriver: true,
    }).start();
  }, [activeProp]);

  const lateralPadding = 4;
  const indicatorW = (containerW - lateralPadding) / 2;

  // Barra de busqueda
  const [showSearchBar, setShowSearchBar] = useState(false);
  const panelH = useRef(new Animated.Value(0)).current;
  const panelOp = useRef(new Animated.Value(0)).current;

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const openPanel = () => {
    setShowSearchBar(true);
    Animated.parallel([
      Animated.timing(panelH, {
        toValue: 48,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(panelOp, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start();
  };
  const closePanel = () => {
    Animated.parallel([
      Animated.timing(panelH, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
      Animated.timing(panelOp, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) setShowSearchBar(false);
      setMonth("");
      setYear("");
      onApplyDates?.({});
    });
  };

  // MM / YYYY
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const handleMonthChange = (text: string) => {
    // Solo permitir números
    const numeric = text.replace(/\D/g, "");
    if (numeric.length === 0) {
      setMonth("");
      return;
    }

    // Si se escribió más de 2 dígitos, corta
    if (numeric.length > 2) return;

    let value = parseInt(numeric, 10);

    // Si el valor supera 12, no se actualiza
    if (isNaN(value) || value < 1 || value > 12) return;

    // Si tiene un solo dígito y es > 1, lo completa con 0 adelante
    if (numeric.length === 1 && value > 1) {
      const formatted = value.toString().padStart(2, "0");
      setMonth(formatted);
      
      yearRef.current?.focus();
      return;
    }

    // Si ya tiene 2 dígitos, completa y pasa al año
    if (numeric.length === 2) {
      setMonth(numeric);
      yearRef.current?.focus();
    } else {
      setMonth(numeric);
    }
  };

  const handleYearChange = (text: string) => {
    const numeric = text.replace(/\D/g, "");
    if (numeric.length > 4) return;

    let value = parseInt(numeric, 10);
    if (isNaN(value)) {
      setYear("");
      return;
    }

    // No permitir antes de 1970 o después del año actual
    if (value > currentYear) value = currentYear;

    setYear(value.toString());
  };

  const applyMonthYear = () => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    // Validaciones adicionales
    if (isNaN(m) || isNaN(y)) return;
    if (y < 1970 || y > currentYear) return;
    if (m < 1 || m > 12) return;

    // Si el año es el actual, no permitir meses futuros
    if (y === currentYear && m > currentMonth) return;

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    onApplyDates?.({
      from: Math.floor(start.getTime() / 1000),
      to: Math.floor(end.getTime() / 1000),
    });
  };

  const onTab = (i: number) => {
    setActiveIdx(i);
    Animated.spring(translateX, { toValue: i, useNativeDriver: true }).start();
    onChangeTab?.(i === 0 ? "mine" : "fav");
  };
  return (
    <View style={styles.tabsWrapper}>
      {/* Si no estamos buscando, muestra los Tabs */}
      {showSearchBar ? (
        <Animated.View
          style={[
            styles.searchPanel,
            { height: panelH, opacity: panelOp, flex: 1 },
          ]}
        >
          <View style={styles.searchBarRow}>
            <TextInput
              ref={monthRef}
              placeholder="MM"
              value={month}
              onChangeText={handleMonthChange}
              style={[styles.dateInput, styles.inputMM]}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.slash}>/</Text>
            <TextInput
              ref={yearRef}
              placeholder="AAAA"
              value={year}
              onChangeText={handleYearChange}
              style={[styles.dateInput, styles.inputYYYY]}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TouchableOpacity
              onPress={applyMonthYear}
              style={styles.applyBtnInline}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closePanel}
              accessibilityLabel="Cerrar búsqueda por fecha"
            >
              <Ionicons name="close" size={18} color="#444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : (
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
            <Text
              style={[styles.tabText, activeIdx === 0 && styles.activeTabText]}
            >
              Mis Diarios
            </Text>
          </Pressable>
          <Pressable style={styles.tab} onPress={() => onTab(1)}>
            <Text
              style={[styles.tabText, activeIdx === 1 && styles.activeTabText]}
            >
              Favoritos
            </Text>
          </Pressable>
        </View>
      )}
      {/* Lupa SOLO cuando la barra no está visible */}
      {!showSearchBar && (
        <TouchableOpacity style={styles.searchButton} onPress={openPanel}>
          <Ionicons name="search" size={22} color={uiColors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
}
