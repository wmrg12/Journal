// HeaderDiarios.tsx
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Easing,
  Platform,
} from "react-native";
import styles from "@/styles/globalStyles";
import { uiColors } from "../constants/colors";

export type TabKey = "mine" | "fav";

type Props = {
  active?: TabKey;
  onChangeTab?: (tab: TabKey) => void;
  onApplyDates?: (range: {
    from?: number;
    to?: number;
  }) => void | boolean | Promise<boolean>;
};

export default function HeaderDiarios({
  active: activeProp = "mine",
  onChangeTab,
  onApplyDates,
}: Props) {
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
  const indicatorW = Math.max((containerW - lateralPadding) / 2, 90);

  // Modal search
  const [modalOpen, setModalOpen] = useState(false);
  const modalOp = useRef(new Animated.Value(0)).current;

  // Inputs
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // Mensaje informativo (error / info)
  const [message, setMessage] = useState<string | null>(null);
  const msgOp = useRef(new Animated.Value(0)).current;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const openModal = () => {
    setModalOpen(true);
    setTimeout(() => monthRef.current?.focus(), 200);
    Animated.timing(modalOp, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  /**
   * closeModal(restore)
   * - restore = true -> limpia filtro (onApplyDates({})) y limpia inputs
   * - restore = false -> cierra sin limpiar filtro (útil si aplicaste una búsqueda)
   */
  const closeModal = (restore = true) => {
    Animated.timing(modalOp, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setModalOpen(false);
      hideMessage();
      if (restore) {
        setMonth("");
        setYear("");
        // RESTAURAR TODOS LOS DIARIOS: callback con objeto vacío
        try {
          onApplyDates?.({});
        } catch (e) {
          // noop
        }
      }
    });
  };

  const showMessage = (txt: string) => {
    setMessage(txt);
    Animated.timing(msgOp, {
      toValue: 1,
      duration: 160,
      useNativeDriver: false,
    }).start();
    setTimeout(() => hideMessage(), 3500);
  };
  const hideMessage = () => {
    Animated.timing(msgOp, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start(() => setMessage(null));
  };

 // Month:

const handleMonthChange = (text: string) => {
  const numeric = text.replace(/\D/g, "");
  if (numeric.length === 0) {
    setMonth("");
    hideMessage();
    return;
  }
  if (numeric.length > 2) return;

  const asNum = parseInt(numeric, 10);
  if (isNaN(asNum)) return;
  if (asNum < 1) {
    showMessage("Mes inválido");
    return;
  }
  if (asNum > 12) {
    showMessage("Mes inválido");
    return;
  }

  // Determinamos contexto de año
  const yearNum = parseInt(year, 10);
  const isYearCurrent = !isNaN(yearNum) && yearNum === currentYear;
  const noYearEntered = year.length === 0;

  const wouldBeFuture = (isYearCurrent || noYearEntered) && asNum > currentMonth;
  if (wouldBeFuture) {
    showMessage("No puedes seleccionar un mes mayor al actual");
    return;
  }

  // Auto-pad: si escribiste un solo dígito 2..9, autocompleta a '02'..'09' y salta al año
  if (numeric.length === 1 && asNum >= 2) {
    const formatted = asNum.toString().padStart(2, "0"); // '2' -> '02'
    setMonth(formatted);
    hideMessage();
    // pequeño delay para que el input actualice antes de hacer focus
    setTimeout(() => yearRef.current?.focus(), 80);
    return;
  }

  // Si escribió '1' dejamos que termine (para 10/11/12)
  setMonth(numeric);
  hideMessage();
  if (numeric.length === 2) {
    const completed = parseInt(numeric, 10);
    const futureOnComplete = (isYearCurrent || noYearEntered) && completed > currentMonth;
    if (futureOnComplete) {
      showMessage("No puedes seleccionar un mes mayor al actual")
      return;
    }
    yearRef.current?.focus();
  }
};


  // Year: acepta hasta 4 dígitos y solo hace clamp cuando el usuario ya completó 4 dígitos.
  const handleYearChange = (text: string) => {
    const numeric = text.replace(/\D/g, "");
    if (numeric.length === 0) {
      setYear("");
      return;
    }
    if (numeric.length > 4) return;

    if (numeric.length < 4) {
      setYear(numeric);
      return;
    }

    let value = parseInt(numeric, 10);
    if (isNaN(value)) {
      setYear("");
      return;
    }
    if (value < 1970) value = 1970;
    if (value > currentYear) value = currentYear;
    setYear(value.toString());
  };

  // ---------- Aplicar mes/año ----------
  const applyMonthYear = async () => {
    hideMessage();

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(m) || isNaN(y)) {
      showMessage("Ingresa mes y año válidos");
      return;
    }
    if (y < 1970 || y > currentYear) {
      showMessage("Año fuera de rango");
      return;
    }
    if (m < 1 || m > 12) {
      showMessage("Mes inválido");
      return;
    }
    // Bloquear fechas futuras también en apply (seguridad adicional)
    if (y > currentYear || (y === currentYear && m > currentMonth)) {
      showMessage("No se permiten fechas futuras");
      return;
    }

    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);

    const payload = {
      from: Math.floor(start.getTime() / 1000),
      to: Math.floor(end.getTime() / 1000),
    };

    try {
      const res = onApplyDates?.(payload);

      if (typeof res === "boolean") {
        if (!res) {
          showMessage(
            `No existen diarios en ${month.toString().padStart(2, "0")}/${year}`
          );
        } else {
          showMessage("Búsqueda aplicada");
          setTimeout(() => closeModal(false), 700);
        }
      } else if (res && typeof (res as Promise<boolean>).then === "function") {
        const ok = await (res as Promise<boolean>);
        if (!ok) {
          showMessage(
            `No existen diarios en ${month.toString().padStart(2, "0")}/${year}`
          );
        } else {
          showMessage("Búsqueda aplicada");
          setTimeout(() => closeModal(false), 700);
        }
      } else {
        // sin retorno desde parent: asumimos OK y cerramos
        showMessage("Búsqueda aplicada");
        setTimeout(() => closeModal(false), 700);
      }
    } catch (err) {
      console.warn("applyMonthYear error:", err);
      showMessage("Error aplicando búsqueda");
    }
  };

  const onTab = (i: number) => {
    setActiveIdx(i);
    Animated.spring(translateX, { toValue: i, useNativeDriver: true }).start();
    onChangeTab?.(i === 0 ? "mine" : "fav");
  };

  return (
    <View style={styles.tabsWrapper}>
      {/* Tabs (sin cambios) */}
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

      {/* Botón para abrir el modal de búsqueda */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={openModal}
        accessibilityLabel="Buscar por fecha"
      >
        <Ionicons name="search" size={22} color={uiColors.danger} />
      </TouchableOpacity>

      {/* Modal overlay (centrado) */}
      {modalOpen ? (
        <Animated.View
          pointerEvents="auto"
          style={[styles.searchModalOverlay, { opacity: modalOp }]}
        >
          <View style={styles.searchModalBackdrop} />

          <Animated.View
            style={[styles.searchModalContent, { opacity: modalOp }]}
          >
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Buscar por mes</Text>
              <TouchableOpacity
                onPress={() => closeModal(true)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Cerrar búsqueda"
              >
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarRow}>
              <TextInput
                ref={monthRef}
                placeholder="MM"
                value={month}
                onChangeText={handleMonthChange}
                style={[styles.inputMM, { marginRight: 6 }]}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
                accessible
              />
              <Text style={styles.slash}>/</Text>
              <TextInput
                ref={yearRef}
                placeholder="AAAA"
                value={year}
                onChangeText={handleYearChange}
                style={[styles.inputYYYY, { marginLeft: 6 }]}
                keyboardType="number-pad"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={applyMonthYear}
                accessible
              />
              <TouchableOpacity
                onPress={applyMonthYear}
                style={[styles.applyBtnInline, { marginLeft: 8 }]}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Mensaje (error / info) */}
            {message ? (
              <Animated.View
                style={[styles.modalMessageWrap, { opacity: msgOp }]}
              >
                <Text style={styles.modalMessageText}>{message}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}
