import { uiColors } from "@/constants/colors";
import { Dimensions, Platform, StyleSheet } from "react-native";

// Obtener dimensiones de pantalla para estilos responsivos
const { width: screenWidth } = Dimensions.get("window");

// Calcular valores responsivos basados en el ancho de pantalla
const isSmallPhone = screenWidth < 375;
const isMediumPhone = screenWidth >= 375 && screenWidth < 412;

// Funciones auxiliares para valores responsivos
const getResponsiveValue = (small: number, medium: number, large: number) => {
  if (isSmallPhone) return small;
  if (isMediumPhone) return medium;
  return large;
};

const styles = StyleSheet.create({

  // --- Estilos Globales ---
  container: {
    flex: 1,
    backgroundColor: uiColors.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: getResponsiveValue(40, 50, 60),
  },

  message: {
    fontSize: getResponsiveValue(16, 18, 19),
    fontWeight: "600",
    color: uiColors.danger,
  },

  fab: {
    position: "absolute",
    bottom: getResponsiveValue(80, 75, 80),
    right: getResponsiveValue(12, 16, 20),
    backgroundColor: uiColors.primary,
    borderRadius: 40,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  // --- Barra de Filtros / Tabs / Home ---
  searchButton: { 
    padding: 6, 
    marginLeft: getResponsiveValue(6, 8, 10) 
  },

  tabsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingVertical: getResponsiveValue(30, 35, 40),
    marginTop: getResponsiveValue(20, 25, 30),
    marginBottom: getResponsiveValue(-10, -15, -20),
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: uiColors.white,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    paddingVertical: 0,
    width: getResponsiveValue(220, 240, 260),
    borderWidth: 1,
    borderColor: uiColors.white,
  },

  tab: {
    width: "50%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveValue(10, 11, 12),
    backgroundColor: "transparent",
    zIndex: 1,
  },

  tabText: {
    fontSize: getResponsiveValue(14, 15, 16),
    color: uiColors.danger,
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
  activeTabText: { fontWeight: "bold" },

  indicator: {
    position: "absolute",
    top: -2,
    bottom: -2,
    left: 2,
    width: getResponsiveValue(110, 120, 136),
    backgroundColor: uiColors.rgba,
    borderRadius: 12,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
    zIndex: 0,
  },

  // Franja izquierda 
  bookBinding: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 22,
    backgroundColor: "rgba(255,255,255,0.28)", 
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  // Línea divisoria sutil
  bookDivider: {
    position: "absolute",
    left: 22,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 1,
  },

  // --- filtros de tab ---
  containerTab: {
    position: "absolute",
    bottom: getResponsiveValue(15, 18, 20),
    left: getResponsiveValue(20, 25, 30),
    right: getResponsiveValue(20, 25, 30),
    backgroundColor: uiColors.white,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  indicatorTab: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 18,
    height: 45,
    backgroundColor: uiColors.rgba,
    borderRadius: 10,
    zIndex: 0,
  },
  rowTab: { flexDirection: "row", flex: 1, justifyContent: "space-around" },
  tabButton: {
    paddingVertical: getResponsiveValue(8, 9, 10),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabLabel: { marginLeft: getResponsiveValue(4, 5, 6) },
  homeRowTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconOnTop: { zIndex: 10 },

  // --- Grid de diarios ---
  gridContent: {
    paddingHorizontal: getResponsiveValue(10, 7, 8),
    paddingTop: getResponsiveValue(10, 70, 80),
    paddingBottom: getResponsiveValue(100, 110, 120),
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: getResponsiveValue(12, 14, 16),
    paddingBottom: getResponsiveValue(100, 110, 120),
  },

  card: {
    width: getResponsiveValue(155, 130, 140),
    height: getResponsiveValue(200, 170, 180),
    margin: getResponsiveValue(8, 10, 12),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    padding: getResponsiveValue(8, 9, 10),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHL: { borderWidth: 2, borderColor: "#FFB300" },
  cardTitle: {
    textAlign: "center",
    color: uiColors.gray,
    fontWeight: "600",
    fontSize: getResponsiveValue(16, 17, 18),
    fontFamily: Platform.select({
      ios: "Times New Roman",
      android: "serif",
      default: "serif",
    }),
  },

  cardWrapper: {
    alignItems: "center",
    marginBottom: getResponsiveValue(6, 7, 8),
  },
  // --- fecha ---
  cardDate: {
    textAlign: "center",
    fontSize: getResponsiveValue(11, 12, 13),
    color: "rgba(0,0,0,0.65)",
    textTransform: "lowercase",
    marginTop: -4,
  },

  // --- favorito ---
  favWrap: {
    position: "absolute",
    top: getResponsiveValue(6, 7, 8),
    left: getResponsiveValue(6, 7, 8),
    zIndex: 2,
  },
  favBtn: {
    width: getResponsiveValue(30, 32, 34),
    height: getResponsiveValue(30, 32, 34),
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    elevation: 0,
  },
  favBtnActive: {
    backgroundColor: "rgba(230,57,70,0.22)",
    borderWidth: 1,
    borderColor: "rgba(230,57,70,0.55)",
  },

  // --- Editar ---
  editWrap: {
    position: "absolute",
    top: getResponsiveValue(165, 127, 135),
    right: getResponsiveValue(120, 95, 100),
  },

  editBtn: {
    width: getResponsiveValue(26, 27, 28),
    height: getResponsiveValue(26, 27, 28),
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiColors.transparent,
    shadowColor: uiColors.transparent,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // --- Panel de busqueda por fechas ---
  searchPanel: {
    overflow: "hidden",
    paddingHorizontal: getResponsiveValue(12, 14, 16),
  },
  searchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveValue(6, 7, 8),
    paddingTop: getResponsiveValue(6, 7, 8),
  },
  chip: {
    paddingHorizontal: getResponsiveValue(8, 9, 10),
    paddingVertical: getResponsiveValue(6, 7, 8),
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    elevation: 1,
  },
  chipActive: {
    backgroundColor: uiColors.rgba,
  },
  chipText: {
    fontSize: getResponsiveValue(10, 11, 12),
    color: uiColors.brown,
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: getResponsiveValue(8, 9, 10),
    paddingTop: getResponsiveValue(8, 9, 10),
  },
  rangeCol: {
    flex: 1,
  },
  applyBtn: {
    height: getResponsiveValue(36, 38, 40),
    paddingHorizontal: getResponsiveValue(12, 13, 14),
    backgroundColor: uiColors.primary,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveValue(4, 5, 6),
  },

  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingHorizontal: getResponsiveValue(8, 9, 10),
    height: getResponsiveValue(40, 42, 44),
    gap: getResponsiveValue(4, 5, 6),
  },

  inputMM: {
    width: getResponsiveValue(70, 76, 82),
    textAlign: "center",
    paddingHorizontal: getResponsiveValue(6, 7, 8),
  },

  inputYYYY: {
    width: getResponsiveValue(95, 102, 110),
    textAlign: "center",
    paddingHorizontal: getResponsiveValue(6, 7, 8),
  },

  slash: {
    marginHorizontal: getResponsiveValue(1, 1.5, 2),
    color: "#777",
  },

  applyBtnInline: {
    height: getResponsiveValue(32, 34, 36),
    paddingHorizontal: getResponsiveValue(10, 11, 12),
    backgroundColor: uiColors.primary,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveValue(4, 5, 6),
  },

  closeBtn: {
    marginLeft: getResponsiveValue(4, 5, 6),
    height: getResponsiveValue(32, 34, 36),
    width: getResponsiveValue(32, 34, 36),
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },

} as const);

export default styles;

